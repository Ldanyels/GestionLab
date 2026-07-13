'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import {
  trabajadorSchema,
  pagoTrabajadorSchema,
  montoEstandarSchema,
} from '@/lib/trabajadores/schema'
import {
  crearTrabajador,
  editarTrabajador,
  eliminarTrabajador,
  crearPago,
  eliminarPago,
  guardarMontoEstandar,
  eliminarMontoEstandar,
} from '@/lib/trabajadores/data'

export interface FormState {
  error: string
}

export async function crearTrabajadorAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const parsed = trabajadorSchema.safeParse({ nombre: String(formData.get('nombre') ?? '') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  const id = await crearTrabajador(parsed.data)
  revalidatePath('/configuracion/trabajadores')
  redirect(`/configuracion/trabajadores/${id}`)
}

export async function editarTrabajadorAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const parsed = trabajadorSchema.safeParse({ nombre: String(formData.get('nombre') ?? '') })
  if (!id) return { error: 'Falta el identificador' }
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  await editarTrabajador(id, parsed.data)
  revalidatePath('/configuracion/trabajadores')
  revalidatePath(`/configuracion/trabajadores/${id}`)
  redirect(`/configuracion/trabajadores/${id}`)
}

export async function eliminarTrabajadorAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await eliminarTrabajador(id)
  revalidatePath('/configuracion/trabajadores')
  redirect('/configuracion/trabajadores')
}

export async function crearPagoTrabajadorAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const trabajadorId = String(formData.get('trabajador_id') ?? '')
  if (!trabajadorId) return { error: 'Falta el trabajador' }
  const parsed = pagoTrabajadorSchema.safeParse({
    monto: String(formData.get('monto') ?? ''),
    fecha: String(formData.get('fecha') ?? ''),
    nota: String(formData.get('nota') ?? ''),
    catalogo_trabajo_id: String(formData.get('catalogo_trabajo_id') ?? ''),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  await crearPago(trabajadorId, parsed.data)
  revalidatePath(`/configuracion/trabajadores/${trabajadorId}`)
  return { error: '' }
}

export async function eliminarPagoTrabajadorAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const trabajadorId = String(formData.get('trabajador_id') ?? '')
  if (!id) return
  await eliminarPago(id)
  if (trabajadorId) revalidatePath(`/configuracion/trabajadores/${trabajadorId}`)
}

export async function guardarMontoEstandarAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const trabajadorId = String(formData.get('trabajador_id') ?? '')
  if (!trabajadorId) return { error: 'Falta el trabajador' }
  const parsed = montoEstandarSchema.safeParse({
    catalogo_trabajo_id: String(formData.get('catalogo_trabajo_id') ?? ''),
    monto: String(formData.get('monto') ?? ''),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  await guardarMontoEstandar(trabajadorId, parsed.data)
  revalidatePath(`/configuracion/trabajadores/${trabajadorId}`)
  return { error: '' }
}

export async function eliminarMontoEstandarAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const trabajadorId = String(formData.get('trabajador_id') ?? '')
  if (!id) return
  await eliminarMontoEstandar(id)
  if (trabajadorId) revalidatePath(`/configuracion/trabajadores/${trabajadorId}`)
}
