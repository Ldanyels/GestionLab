'use server'

import { revalidatePath } from 'next/cache'
import { requireSuperAdmin } from '@/lib/plataforma/acceso'
import { cambiarEstadoLaboratorio } from '@/lib/plataforma/laboratorios'
import { intentarSinEstado } from '@/lib/acciones'

/**
 * Suspende o reactiva un laboratorio.
 *
 * `requireSuperAdmin()` va aquí y no solo en el layout: una Server Action se
 * puede invocar directamente, sin pasar por la página que la contiene.
 */
export async function cambiarEstadoAction(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const id = String(formData.get('id') ?? '')
  const estado = String(formData.get('estado') ?? '')
  if (!id || (estado !== 'activo' && estado !== 'suspendido')) return

  await intentarSinEstado(
    'cambiarEstadoAction',
    'No se pudo cambiar el estado del laboratorio',
    () => cambiarEstadoLaboratorio(id, estado),
  )

  revalidatePath('/plataforma')
}
