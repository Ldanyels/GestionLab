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
  ponerFechaEntrega,
  marcarEtapa,
} from '@/lib/trabajos/data'
import { hoyLima } from '@/lib/trabajos/agenda'
import type { EstadoEtapa, EstadoTrabajo } from '@/lib/trabajos/estado'
import { abonoSchema } from '@/lib/abonos/schema'
import { crearAbono, editarAbono, eliminarAbono } from '@/lib/abonos/data'
import { anotarDetalle } from '@/lib/auditoria/anotar'
import { descontarInsumosPorTrabajo } from '@/lib/inventario/data'

export interface FormState {
  error: string
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

export async function crearTrabajoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = leerTrabajo(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const r = await intentar('crearTrabajoAction', 'No se pudo guardar el trabajo', () =>
    crearTrabajo(parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath('/trabajos')
  revalidatePath('/hoy')
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

export async function eliminarTrabajoAction(formData: FormData): Promise<void> {
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

/**
 * Pone, cambia o quita la fecha prometida de entrega desde la ficha.
 *
 * Existe para los trabajos que ya están en curso: entrar al formulario completo
 * para poner una fecha es fricción suficiente como para que no se haga, y ese
 * fue justamente el problema —46 de 47 trabajos sin fecha.
 *
 * Sin permiso especial, como las demás acciones sobre trabajos: prometer una
 * fecha al consultorio es parte del trabajo del técnico, no una corrección de
 * control. El límite lo pone RLS, que impide tocar el trabajo de otro
 * laboratorio aunque se invoque la acción directamente.
 *
 * Quitar la fecha se pide con el campo `quitar`, no mandando el campo vacío.
 * Un vacío puede venir de que el input no se llenó; `quitar` solo puede venir
 * de que alguien pulsó «Quitar». La diferencia importa porque borrar una fecha
 * prometida es una decisión, no un descuido.
 */
export async function ponerFechaEntregaAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const bruto = String(formData.get('fecha_entrega') ?? '').trim()
  const quitar = String(formData.get('quitar') ?? '') === '1'
  if (!id) return
  if (!quitar && !/^\d{4}-\d{2}-\d{2}$/.test(bruto)) return

  const fecha = quitar ? null : bruto
  await intentarSinEstado(
    'ponerFechaEntregaAction',
    'No se pudo guardar la fecha de entrega',
    () => ponerFechaEntrega(id, fecha),
  )

  revalidatePath(`/trabajos/${id}`)
  revalidatePath('/trabajos')
  revalidatePath('/hoy')
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
  const parsed = abonoSchema.safeParse({
    monto: String(formData.get('monto') ?? ''),
    metodo: String(formData.get('metodo') ?? 'efectivo'),
    fecha: String(formData.get('fecha') ?? ''),
    nota: String(formData.get('nota') ?? ''),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const r = await intentar('crearAbonoAction', 'No se pudo registrar el abono', () =>
    crearAbono(trabajoId, parsed.data),
  )
  if (!r.ok) return r.estado

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
