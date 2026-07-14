'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import {
  usuarioSchema,
  crearUsuario,
  cambiarRolUsuario,
  eliminarUsuario,
} from '@/lib/usuarios/data'
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

export async function eliminarUsuarioAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await eliminarUsuario(id)
  revalidatePath('/configuracion/usuarios')
}
