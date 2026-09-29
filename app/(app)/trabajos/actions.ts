'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { intentar, intentarSinEstado } from '@/lib/acciones'
import { requireAdmin, requirePermiso } from '@/lib/auth'
import { trabajoSchema } from '@/lib/trabajos/schema'
import {
  crearTrabajo,
  editarTrabajo,
  eliminarTrabajo,
  cambiarEstadoTrabajo,
  corregirFechaEntrega,
  marcarEtapa,
} from '@/lib/trabajos/data'
import { hoyLima } from '@/lib/trabajos/agenda'
import {
  buscarPosiblesDuplicados,
  type PosibleDuplicado,
} from '@/lib/trabajos/duplicados-data'
import type { EstadoEtapa, EstadoTrabajo } from '@/lib/trabajos/estado'
import { abonoSchema } from '@/lib/abonos/schema'
import { crearAbono, editarAbono, eliminarAbono } from '@/lib/abonos/data'
import { anotarDetalle } from '@/lib/auditoria/anotar'
import { descontarInsumosPorTrabajo } from '@/lib/inventario/data'

export interface FormState {
  error: string
  /**
   * Trabajos que pueden ser el mismo que se intenta registrar.
   *
   * Cuando llega con contenido, **el trabajo no se guardó**: se está esperando
   * a que quien lo registra mire lo que ya existe y decida. Opcional para no
   * tocar a las demás acciones que comparten este tipo.
   */
  duplicados?: PosibleDuplicado[]
  /**
   * Id del trabajo recién creado.
   *
   * Solo llega cuando el formulario traía fotos: entonces la acción **no**
   * redirige, porque el navegador todavía tiene que subirlas —una foto se
   * guarda en una carpeta con el id del trabajo, así que no puede subirse antes
   * de que exista—. Sin fotos, la acción redirige como siempre y este campo
   * nunca aparece.
   */
  creadoId?: string
}

function leerTrabajo(formData: FormData) {
  return trabajoSchema.safeParse({
    doctor_id: String(formData.get('doctor_id') ?? ''),
    items: String(formData.get('items') ?? '[]'),
    paciente_nombre: String(formData.get('paciente_nombre') ?? ''),
    precio_manual: String(formData.get('precio_manual') ?? ''),
    fecha_entrega: String(formData.get('fecha_entrega') ?? ''),
    notas: String(formData.get('notas') ?? ''),
  })
}

/**
 * Registra un trabajo, avisando antes si puede estar duplicado.
 *
 * Un técnico registra un trabajo hoy y mañana otro registra el mismo: queda
 * información falsa y se le cobra dos veces al consultorio. Se comprueban tres
 * cosas a la vez —consultorio, paciente y tipo de trabajo— en los cinco días
 * anteriores.
 *
 * Si encuentra algo, **no guarda**: devuelve lo que ya existe para que quien
 * registra lo mire. Solo un segundo envío con `confirmado` guarda de verdad.
 * No se bloquea nunca: en los datos reales había cuatro pares de trabajos del
 * mismo consultorio y tipo que eran encargos legítimos, y un bloqueo los habría
 * rechazado. Quien registra es quien sabe.
 */
export async function crearTrabajoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = leerTrabajo(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  if (String(formData.get('confirmado') ?? '') !== '1') {
    /*
      La comprobación no puede impedir registrar producción.

      Si falla —la vista no existe, la red se cae— se sigue adelante y se
      guarda. Un filtro de calidad que deje a un laboratorio sin poder trabajar
      es peor que el duplicado que evita.
    */
    const duplicados = await buscarPosiblesDuplicados({
      doctorId: parsed.data.doctor_id,
      pacienteNombre: parsed.data.paciente_nombre,
      tipos: parsed.data.items.map((i) => i.catalogo_trabajo_id),
      fechaIngreso: hoyLima(),
    }).catch(() => [] as PosibleDuplicado[])

    if (duplicados.length > 0) return { error: '', duplicados }
  }

  const r = await intentar('crearTrabajoAction', 'No se pudo guardar el trabajo', () =>
    crearTrabajo(parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath('/trabajos')
  revalidatePath('/hoy')

  /*
    Con fotos pendientes se devuelve el id en lugar de redirigir.

    `redirect()` corta la ejecución lanzando, así que el navegador nunca
    recibiría el id y las fotos elegidas se perderían al cambiar de pantalla.
    Quien navega, en ese caso, es el cliente: después de subirlas.
  */
  if (String(formData.get('con_fotos') ?? '') === '1') {
    return { error: '', creadoId: r.valor }
  }

  redirect(`/trabajos/${r.valor}`)
}

export async function editarTrabajoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '')
  const parsed = leerTrabajo(formData)
  if (!id) return { error: 'Falta el identificador' }
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const r = await intentar('editarTrabajoAction', 'No se pudieron guardar los cambios', () =>
    editarTrabajo(id, parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath('/trabajos')
  revalidatePath(`/trabajos/${id}`)
  redirect(`/trabajos/${id}`)
}

/**
 * Borra un trabajo con sus etapas y sus abonos.
 *
 * Solo administradores. Registrar, editar y mover de estado un trabajo es la
 * labor del técnico; borrarlo destruye también el registro del dinero cobrado
 * sobre él, y eso no se deshace. Hasta ahora no había ninguna comprobación.
 */
export async function eliminarTrabajoAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await intentarSinEstado('eliminarTrabajoAction', 'No se pudo eliminar el trabajo', () =>
    eliminarTrabajo(id),
  )

  revalidatePath('/trabajos')
  revalidatePath('/hoy')
  redirect('/trabajos')
}

export async function cambiarEstadoTrabajoAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const estado = String(formData.get('estado') ?? '') as EstadoTrabajo
  if (!id || !['en_curso', 'cerrado', 'entregado'].includes(estado)) return

  await intentarSinEstado(
    'cambiarEstadoTrabajoAction',
    'No se pudo cambiar el estado del trabajo',
    async () => {
      // La fecha se calcula aquí, en el servidor y en la zona de Lima: dejarla
      // a la base sería `current_date` en UTC, que de noche adelanta un día.
      await cambiarEstadoTrabajo(id, estado, hoyLima())
      // Al cerrar (o entregar), descontar insumos según receta (una sola vez).
      if (estado === 'cerrado' || estado === 'entregado') {
        await descontarInsumosPorTrabajo(id)
      }
    },
  )

  if (estado === 'cerrado' || estado === 'entregado') revalidatePath('/inventario')
  revalidatePath(`/trabajos/${id}`)
  revalidatePath('/trabajos')
  revalidatePath('/hoy')
}

/**
 * Corrige la fecha real de entrega de un trabajo ya entregado.
 *
 * Solo administradores: es un dato de control, y quien lo corrige está
 * reescribiendo el registro de algo que ya pasó.
 */
export async function corregirFechaEntregaAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const fecha = String(formData.get('entregado_el') ?? '')
  // Se exige el formato completo: un `input[type=date]` vacío manda '', y
  // guardar eso borraría la fecha sin que nadie lo haya pedido.
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return

  await intentarSinEstado(
    'corregirFechaEntregaAction',
    'No se pudo corregir la fecha de entrega',
    () => corregirFechaEntrega(id, fecha),
  )

  revalidatePath(`/trabajos/${id}`)
  revalidatePath('/trabajos')
}


export async function marcarEtapaAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const trabajoId = String(formData.get('trabajo_id') ?? '')
  const estado = String(formData.get('estado') ?? '') as EstadoEtapa
  const motivo = String(formData.get('motivo') ?? '')
  if (!id || !['pendiente', 'en_progreso', 'completada', 'excluida'].includes(estado)) {
    return
  }

  await intentarSinEstado('marcarEtapaAction', 'No se pudo actualizar la etapa', () =>
    marcarEtapa(id, estado, motivo),
  )

  if (trabajoId) revalidatePath(`/trabajos/${trabajoId}`)
}

export async function crearAbonoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Antes esta acción no comprobaba nada: la sección de pagos estaba oculta
  // para el técnico en la interfaz, pero cualquiera podía invocar la acción
  // directamente y registrar un abono. La comprobación va aquí, en el servidor.
  await requirePermiso('abonos_registrar')

  const trabajoId = String(formData.get('trabajo_id') ?? '')
  if (!trabajoId) return { error: 'Falta el trabajo' }

  /*
    «Trabajo cerrado» es el otro botón del mismo formulario.

    Cerrar cobrando es el final normal: el consultorio recoge la pieza y paga lo
    que falta en el mismo gesto. Obligar a dos envíos —registrar y luego
    cerrar— es justo donde se perdían los cobros, así que un solo botón hace las
    dos cosas.

    Sin importe escrito solo cierra: también se cierra un trabajo ya pagado, o
    uno que se cobra por fuera.
  */
  const cerrar = String(formData.get('cerrar') ?? '') === '1'
  const monto = String(formData.get('monto') ?? '').trim()

  if (monto !== '') {
    const parsed = abonoSchema.safeParse({
      monto,
      metodo: String(formData.get('metodo') ?? 'efectivo'),
      fecha: String(formData.get('fecha') ?? ''),
      nota: String(formData.get('nota') ?? ''),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

    const r = await intentar('crearAbonoAction', 'No se pudo registrar el abono', () =>
      crearAbono(trabajoId, parsed.data),
    )
    /*
      Si el abono falla no se cierra. Cerrar un trabajo dando por cobrado un
      dinero que no se guardó deja una deuda invisible: nadie vuelve a mirar un
      trabajo cerrado.
    */
    if (!r.ok) return r.estado
  } else if (!cerrar) {
    return { error: 'Escribe el monto' }
  }

  if (cerrar) {
    const c = await intentar('crearAbonoAction/cerrar', 'No se pudo cerrar el trabajo', async () => {
      await cambiarEstadoTrabajo(trabajoId, 'cerrado', hoyLima())
      await descontarInsumosPorTrabajo(trabajoId)
    })
    if (!c.ok) return c.estado
    revalidatePath('/inventario')
    revalidatePath('/trabajos')
    revalidatePath('/hoy')
  }

  revalidatePath(`/trabajos/${trabajoId}`)
  return { error: '' }
}

/**
 * Corrige un abono ya registrado.
 *
 * Lo puede hacer quien puede registrarlos —técnico autorizado o
 * administrador—, y no solo el administrador: quien puede crear un abono de
 * cualquier monto ya tiene el poder de equivocarse en cualquier dirección, y
 * obligarlo a pedir ayuda por un error de tecleo vuelve inútil su permiso.
 *
 * Lo que protege el dinero aquí no es el muro de permisos, es que **el monto
 * anterior queda en el historial**.
 */
export async function editarAbonoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const perfil = await requirePermiso('abonos_registrar')

  const id = String(formData.get('id') ?? '')
  const trabajoId = String(formData.get('trabajo_id') ?? '')
  if (!id) return { error: 'Falta el abono' }

  const parsed = abonoSchema.safeParse({
    monto: String(formData.get('monto') ?? ''),
    metodo: String(formData.get('metodo') ?? 'efectivo'),
    fecha: String(formData.get('fecha') ?? ''),
    nota: String(formData.get('nota') ?? ''),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos' }
  }

  const r = await intentar('editarAbonoAction', 'No se pudo corregir el abono', () =>
    editarAbono(id, parsed.data),
  )
  if (!r.ok) return r.estado
  if (!r.valor) return { error: 'Ese abono ya no existe' }

  // Después de guardar y sin condicionar nada: `anotarDetalle` no lanza.
  await anotarDetalle({
    laboratorioId: perfil.laboratorio_id,
    tabla: 'abono',
    registroId: id,
    accion: 'UPDATE',
    detalle: r.valor.detalle,
    usuarioId: perfil.id,
    usuarioNombre: perfil.nombre,
  })

  revalidatePath(`/trabajos/${trabajoId || r.valor.trabajoId}`)
  revalidatePath('/trabajos')
  revalidatePath('/reportes')
  return { error: '' }
}

export async function eliminarAbonoAction(formData: FormData): Promise<void> {
  // Borrar un abono es solo del administrador, aunque el técnico tenga el
  // permiso para registrarlos: un pago cobrado no debe poder desaparecer sin
  // que lo decida quien lleva la caja.
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  const trabajoId = String(formData.get('trabajo_id') ?? '')
  if (!id) return

  await intentarSinEstado('eliminarAbonoAction', 'No se pudo eliminar el abono', () =>
    eliminarAbono(id),
  )

  if (trabajoId) revalidatePath(`/trabajos/${trabajoId}`)
}
