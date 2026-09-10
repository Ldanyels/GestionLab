'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireSuperAdmin } from '@/lib/plataforma/acceso'
import {
  cambiarEstadoLaboratorio,
  crearLaboratorioConAdmin,
  laboratorioNuevoSchema,
} from '@/lib/plataforma/laboratorios'
import { intentar, intentarSinEstado } from '@/lib/acciones'

/**
 * Da de alta un laboratorio con su primer administrador.
 *
 * Sustituye los tres pasos manuales de SQL que había que hacer a mano por cada
 * cliente nuevo, que es lo que impedía vender el sistema sin intervención.
 */
export async function crearLaboratorioAction(
  _prev: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  await requireSuperAdmin()

  const parsed = laboratorioNuevoSchema.safeParse({
    laboratorio: String(formData.get('laboratorio') ?? ''),
    adminNombre: String(formData.get('adminNombre') ?? ''),
    adminEmail: String(formData.get('adminEmail') ?? ''),
    adminPassword: String(formData.get('adminPassword') ?? ''),
    facTipo: String(formData.get('facTipo') ?? 'RUC'),
    facNumero: String(formData.get('facNumero') ?? ''),
    facRazonSocial: String(formData.get('facRazonSocial') ?? ''),
    facDireccion: String(formData.get('facDireccion') ?? ''),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos' }
  }

  const r = await intentar(
    'crearLaboratorioAction',
    'No se pudo crear el laboratorio',
    () => crearLaboratorioConAdmin(parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath('/plataforma')
  // Fuera del envoltorio: `redirect()` funciona lanzando una excepción y un
  // `try/catch` la tomaría por un fallo, con el laboratorio ya creado.
  redirect('/plataforma')
}

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
