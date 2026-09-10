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
  corregirTrabajoDesdeLaPlataforma,
} from '@/lib/plataforma/correcciones'
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
