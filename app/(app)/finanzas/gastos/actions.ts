'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { intentar, intentarSinEstado } from '@/lib/acciones'
import { crearGasto, editarGasto, eliminarGasto } from '@/lib/gastos/data'
import { gastoSchema } from '@/lib/gastos/schema'

export interface FormState {
  error: string
}

/**
 * Los gastos son de administración.
 *
 * Un técnico registra su trabajo y cobra; cuánto cuesta la luz o el alquiler es
 * información del negocio, no de la producción. Es la misma línea que separa
 * Finanzas del resto de la aplicación.
 */
function leer(formData: FormData) {
  return gastoSchema.safeParse({
    categoria: String(formData.get('categoria') ?? ''),
    concepto: String(formData.get('concepto') ?? ''),
    monto: String(formData.get('monto') ?? ''),
    fecha: String(formData.get('fecha') ?? ''),
  })
}

export async function crearGastoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const parsed = leer(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos' }

  const r = await intentar('crearGastoAction', 'No se pudo guardar el gasto', () =>
    crearGasto(parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath('/finanzas/gastos')
  revalidatePath('/finanzas')
  return { error: '' }
}

export async function editarGastoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Falta el gasto' }
  const parsed = leer(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos' }

  const r = await intentar('editarGastoAction', 'No se pudo guardar el gasto', () =>
    editarGasto(id, parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath('/finanzas/gastos')
  revalidatePath('/finanzas')
  return { error: '' }
}

export async function eliminarGastoAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await intentarSinEstado('eliminarGastoAction', 'No se pudo eliminar el gasto', () =>
    eliminarGasto(id),
  )

  revalidatePath('/finanzas/gastos')
  revalidatePath('/finanzas')
}
