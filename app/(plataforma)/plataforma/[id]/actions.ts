'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { correoSesion, requireSuperAdmin } from '@/lib/plataforma/acceso'
import {
  crearUsuarioDesdeLaPlataforma,
  restablecerClaveDesdeLaPlataforma,
} from '@/lib/plataforma/usuarios'
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
