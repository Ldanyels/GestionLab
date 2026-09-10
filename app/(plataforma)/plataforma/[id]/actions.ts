'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { correoSesion, requireSuperAdmin } from '@/lib/plataforma/acceso'
import {
  crearUsuarioDesdeLaPlataforma,
  restablecerClaveDesdeLaPlataforma,
} from '@/lib/plataforma/usuarios'
import {
  borrarAbonoDesdeLaPlataforma,
  corregirPrecioBaseDesdeLaPlataforma,
  corregirTrabajoDesdeLaPlataforma,
  crearItemDeCatalogoDesdeLaPlataforma,
} from '@/lib/plataforma/correcciones'
import { catalogoSchema } from '@/lib/catalogo/schema'
import { datosFacturacionSchema } from '@/lib/facturacion/documento'
import { guardarFacturacion } from '@/lib/facturacion/data'
import { anularCuota, guardarCondicionesDeCobro, marcarCuotaPagada } from '@/lib/cuotas/data'
import { PERIODICIDADES, type Periodicidad } from '@/lib/cuotas/periodos'
import { usuarioSchema } from '@/lib/usuarios/data'
import { intentar, intentarSinEstado } from '@/lib/acciones'

/**
 * Restablece la contraseña de un usuario de un laboratorio ajeno.
 *
 * `requireSuperAdmin()` va aquí y no solo en el layout: una Server Action se
 * puede invocar directamente, sin pasar por la página que la contiene. Y el
 * correo del operador se toma de la sesión, nunca del formulario: si viniera
 * del cliente, cualquiera podría firmar el registro con otro nombre.
 */
export async function restablecerClaveDeLaboratorioAction(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const correo = await correoSesion()
  if (!correo) return

  const labId = String(formData.get('laboratorio_id') ?? '')
  const usuarioId = String(formData.get('usuario_id') ?? '')
  const nombre = String(formData.get('nombre') ?? '')
  const password = String(formData.get('password') ?? '')
  if (!labId || !usuarioId || password.length < 6) return

  await intentarSinEstado(
    'restablecerClaveDeLaboratorioAction',
    'No se pudo restablecer la contraseña',
    async () => {
      await restablecerClaveDesdeLaPlataforma(labId, usuarioId, password, correo, nombre)
    },
  )

  revalidatePath(`/plataforma/${labId}`)
}

/**
 * Corrige un trabajo de un laboratorio ajeno.
 *
 * Los campos llegan como texto y se convierten aquí. `entregado_el` vacío se
 * manda como `null` y no se descarta: vaciar la fecha de entrega es una
 * corrección legítima, distinta de no tocarla.
 */
export async function corregirTrabajoAction(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const correo = await correoSesion()
  if (!correo) return

  const labId = String(formData.get('laboratorio_id') ?? '')
  const trabajoId = String(formData.get('trabajo_id') ?? '')
  if (!labId || !trabajoId) return

  const precio = Number(formData.get('precio_acordado'))
  const estado = String(formData.get('estado') ?? '')
  const fechaIngreso = String(formData.get('fecha_ingreso') ?? '')
  const entrega = String(formData.get('entregado_el') ?? '')

  if (!Number.isFinite(precio) || precio < 0) return
  if (estado !== 'en_curso' && estado !== 'cerrado' && estado !== 'entregado') return
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaIngreso)) return

  await intentarSinEstado(
    'corregirTrabajoAction',
    'No se pudo corregir el trabajo',
    async () => {
      await corregirTrabajoDesdeLaPlataforma(
        labId,
        trabajoId,
        {
          precio_acordado: precio,
          estado,
          fecha_ingreso: fechaIngreso,
          entregado_el: entrega === '' ? null : entrega,
        },
        correo,
      )
    },
  )

  revalidatePath(`/plataforma/${labId}`)
  revalidatePath(`/plataforma/${labId}/trabajos/${trabajoId}`)
}

/** Borra un abono mal registrado de un laboratorio ajeno. */
export async function borrarAbonoDeLaboratorioAction(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const correo = await correoSesion()
  if (!correo) return

  const labId = String(formData.get('laboratorio_id') ?? '')
  const abonoId = String(formData.get('abono_id') ?? '')
  const trabajoId = String(formData.get('trabajo_id') ?? '')
  if (!labId || !abonoId) return

  await intentarSinEstado(
    'borrarAbonoDeLaboratorioAction',
    'No se pudo borrar el abono',
    async () => {
      await borrarAbonoDesdeLaPlataforma(labId, abonoId, correo)
    },
  )

  revalidatePath(`/plataforma/${labId}`)
  if (trabajoId) revalidatePath(`/plataforma/${labId}/trabajos/${trabajoId}`)
}

/** Corrige el precio base de un tipo del catálogo de un laboratorio ajeno. */
export async function corregirPrecioBaseAction(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const correo = await correoSesion()
  if (!correo) return

  const labId = String(formData.get('laboratorio_id') ?? '')
  const itemId = String(formData.get('item_id') ?? '')
  const precio = Number(formData.get('precio_base'))
  if (!labId || !itemId || !Number.isFinite(precio) || precio < 0) return

  await intentarSinEstado(
    'corregirPrecioBaseAction',
    'No se pudo corregir el precio',
    async () => {
      await corregirPrecioBaseDesdeLaPlataforma(labId, itemId, precio, correo)
    },
  )

  revalidatePath(`/plataforma/${labId}/catalogo`)
}

/** Añade un tipo al catálogo de un laboratorio ajeno. */
export async function crearItemDeCatalogoAction(
  _prev: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  await requireSuperAdmin()
  const correo = await correoSesion()
  if (!correo) return { error: 'Sesión no válida' }

  const labId = String(formData.get('laboratorio_id') ?? '')
  if (!labId) return { error: 'Falta el laboratorio' }

  // Se reutiliza el esquema del catálogo del propio laboratorio: las reglas de
  // qué es un tipo válido son las mismas, venga de donde venga.
  const parsed = catalogoSchema.safeParse({
    categoria: String(formData.get('categoria') ?? ''),
    nombre: String(formData.get('nombre') ?? ''),
    precio_base: String(formData.get('precio_base') ?? '0'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos' }
  }

  const r = await intentar(
    'crearItemDeCatalogoAction',
    'No se pudo añadir el tipo al catálogo',
    () =>
      crearItemDeCatalogoDesdeLaPlataforma(
        labId,
        {
          categoria: parsed.data.categoria,
          nombre: parsed.data.nombre,
          precio_base: parsed.data.precio_base,
        },
        correo,
      ),
  )
  if (!r.ok) return r.estado

  revalidatePath(`/plataforma/${labId}/catalogo`)
  return { error: '' }
}

/** Guarda los datos de facturación de un laboratorio. */
export async function guardarFacturacionAction(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const correo = await correoSesion()
  if (!correo) return

  const labId = String(formData.get('laboratorio_id') ?? '')
  if (!labId) return

  const parsed = datosFacturacionSchema.safeParse({
    doc_tipo: String(formData.get('doc_tipo') ?? ''),
    doc_numero: String(formData.get('doc_numero') ?? ''),
    razon_social: String(formData.get('razon_social') ?? ''),
    direccion_fiscal: String(formData.get('direccion_fiscal') ?? ''),
  })
  // Sin estado de formulario que devolver: el navegador ya exige los campos, y
  // un número mal escrito se corrige volviendo a guardar.
  if (!parsed.success) return

  await intentarSinEstado(
    'guardarFacturacionAction',
    'No se pudieron guardar los datos de facturación',
    () => guardarFacturacion(labId, parsed.data, correo),
  )

  revalidatePath(`/plataforma/${labId}`)
}

/** Guarda las condiciones de cobro: plan, periodicidad, precio e inicio. */
export async function guardarCondicionesDeCobroAction(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const correo = await correoSesion()
  if (!correo) return

  const labId = String(formData.get('laboratorio_id') ?? '')
  const plan = String(formData.get('plan') ?? '')
  const periodicidad = String(formData.get('periodicidad') ?? '')
  const precio = Number(formData.get('precio_cuota'))
  const inicio = String(formData.get('inicio_cobro') ?? '')

  if (!labId) return
  if (plan !== 'gratis' && plan !== 'pagado') return
  if (!(PERIODICIDADES as readonly string[]).includes(periodicidad)) return
  if (!Number.isFinite(precio) || precio < 0) return

  await intentarSinEstado(
    'guardarCondicionesDeCobroAction',
    'No se pudieron guardar las condiciones de cobro',
    async () => {
      await guardarCondicionesDeCobro(labId, {
        plan,
        periodicidad: periodicidad as Periodicidad,
        precio_cuota: precio,
        // Sin fecha no se genera nada: es la forma de dejar el cobro en pausa
        // sin pasar el laboratorio a cortesía.
        inicio_cobro: /^\d{4}-\d{2}-\d{2}$/.test(inicio) ? inicio : null,
      })
    },
  )

  revalidatePath('/plataforma')
  revalidatePath(`/plataforma/${labId}`)
}

/**
 * Marca una cuota como pagada.
 *
 * Pide fecha, medio y comprobante porque una cuota marcada como pagada sin
 * decir cuándo ni con qué no sirve para cuadrar caja a fin de mes, que es para
 * lo que existe este registro.
 */
export async function marcarCuotaPagadaAction(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const labId = String(formData.get('laboratorio_id') ?? '')
  const cuotaId = String(formData.get('cuota_id') ?? '')
  const pagadaEl = String(formData.get('pagada_el') ?? '')
  const medio = String(formData.get('medio_pago') ?? '')
  const comprobante = String(formData.get('comprobante') ?? '').trim()

  if (!cuotaId || !/^\d{4}-\d{2}-\d{2}$/.test(pagadaEl) || !medio) return

  await intentarSinEstado(
    'marcarCuotaPagadaAction',
    'No se pudo registrar el pago de la cuota',
    () =>
      marcarCuotaPagada(cuotaId, {
        pagada_el: pagadaEl,
        medio_pago: medio,
        comprobante: comprobante || null,
      }),
  )

  revalidatePath('/plataforma')
  if (labId) revalidatePath(`/plataforma/${labId}`)
}

/** Anula una cuota emitida por error. No se borra: la anulación es información. */
export async function anularCuotaAction(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const labId = String(formData.get('laboratorio_id') ?? '')
  const cuotaId = String(formData.get('cuota_id') ?? '')
  const nota = String(formData.get('nota') ?? '').trim()
  if (!cuotaId || !nota) return

  await intentarSinEstado('anularCuotaAction', 'No se pudo anular la cuota', () =>
    anularCuota(cuotaId, nota),
  )

  revalidatePath('/plataforma')
  if (labId) revalidatePath(`/plataforma/${labId}`)
}

/** Crea un usuario en un laboratorio ajeno. */
export async function crearUsuarioDeLaboratorioAction(
  _prev: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  await requireSuperAdmin()
  const correo = await correoSesion()
  if (!correo) return { error: 'Sesión no válida' }

  const labId = String(formData.get('laboratorio_id') ?? '')
  if (!labId) return { error: 'Falta el laboratorio' }

  const parsed = usuarioSchema.safeParse({
    nombre: String(formData.get('nombre') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    rol: String(formData.get('rol') ?? ''),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos' }
  }

  const r = await intentar(
    'crearUsuarioDeLaboratorioAction',
    'No se pudo crear el usuario',
    () => crearUsuarioDesdeLaPlataforma(labId, parsed.data, correo),
  )
  if (!r.ok) return r.estado

  revalidatePath(`/plataforma/${labId}`)
  // Fuera del envoltorio: `redirect` funciona lanzando una excepción.
  redirect(`/plataforma/${labId}`)
}
