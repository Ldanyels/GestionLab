'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { trabajoSchema } from '@/lib/trabajos/schema'
import {
  crearTrabajo,
  editarTrabajo,
  eliminarTrabajo,
  cambiarEstadoTrabajo,
  marcarEtapa,
} from '@/lib/trabajos/data'
import type { EstadoEtapa, EstadoTrabajo } from '@/lib/trabajos/estado'

export interface FormState {
  error: string
}

function leerTrabajo(formData: FormData) {
  return trabajoSchema.safeParse({
    doctor_id: String(formData.get('doctor_id') ?? ''),
    catalogo_trabajo_id: String(formData.get('catalogo_trabajo_id') ?? ''),
    paciente_nombre: String(formData.get('paciente_nombre') ?? ''),
    variable_cantidad: String(formData.get('variable_cantidad') ?? '0'),
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
  const id = await crearTrabajo(parsed.data)
  revalidatePath('/trabajos')
  revalidatePath('/hoy')
  redirect(`/trabajos/${id}`)
}

export async function editarTrabajoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '')
  const parsed = leerTrabajo(formData)
  if (!id) return { error: 'Falta el identificador' }
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  await editarTrabajo(id, parsed.data)
  revalidatePath('/trabajos')
  revalidatePath(`/trabajos/${id}`)
  redirect(`/trabajos/${id}`)
}

export async function eliminarTrabajoAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await eliminarTrabajo(id)
  revalidatePath('/trabajos')
  revalidatePath('/hoy')
  redirect('/trabajos')
}

export async function cambiarEstadoTrabajoAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const estado = String(formData.get('estado') ?? '') as EstadoTrabajo
  if (!id || !['en_curso', 'cerrado', 'entregado'].includes(estado)) return
  await cambiarEstadoTrabajo(id, estado)
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
  await marcarEtapa(id, estado, motivo)
  if (trabajoId) revalidatePath(`/trabajos/${trabajoId}`)
}
