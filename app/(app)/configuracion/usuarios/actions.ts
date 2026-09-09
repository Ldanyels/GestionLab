'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { intentar } from '@/lib/acciones'
import {
  usuarioSchema,
  crearUsuario,
  cambiarRolUsuario,
  guardarPermisosUsuario,
  eliminarUsuario,
  restablecerClave,
} from '@/lib/usuarios/data'
import { claveNuevaSchema } from '@/lib/usuarios/recuperacion'
import { PERMISOS } from '@/lib/permisos'
import type { Rol } from '@/lib/supabase/types'

export interface FormState {
  error: string
  ok?: boolean
}

export async function crearUsuarioAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const parsed = usuarioSchema.safeParse({
    nombre: String(formData.get('nombre') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    rol: String(formData.get('rol') ?? 'tecnico'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await crearUsuario(parsed.data)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo crear el usuario' }
  }
  revalidatePath('/configuracion/usuarios')
  return { error: '', ok: true }
}

export async function cambiarRolAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const rol = String(formData.get('rol') ?? '') as Rol
  if (!id || !['admin', 'tecnico'].includes(rol)) return
  await cambiarRolUsuario(id, rol)
  revalidatePath('/configuracion/usuarios')
}

export async function guardarPermisosAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  // Las casillas marcadas llegan con el nombre del permiso.
  const marcados = PERMISOS.filter((p) => formData.get(p) === 'on')
  await guardarPermisosUsuario(id, marcados)
  revalidatePath('/configuracion/usuarios')
}

/**
 * El administrador fija una contraseña nueva para alguien de su equipo.
 *
 * La comprobación de laboratorio vive en `restablecerClave`, no aquí:
 * `requireAdmin()` confirma que quien pide es administrador, pero no de qué
 * laboratorio es el usuario objetivo.
 */
export async function restablecerClaveAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Falta el usuario' }

  const parsed = claveNuevaSchema.safeParse({
    password: String(formData.get('password') ?? ''),
    confirmacion: String(formData.get('confirmacion') ?? ''),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const r = await intentar(
    'restablecerClaveAction',
    'No se pudo cambiar la contraseña',
    () => restablecerClave(id, parsed.data.password),
  )
  if (!r.ok) return r.estado

  revalidatePath('/configuracion/usuarios')
  return { error: '', ok: true }
}

export async function eliminarUsuarioAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await eliminarUsuario(id)
  revalidatePath('/configuracion/usuarios')
}
