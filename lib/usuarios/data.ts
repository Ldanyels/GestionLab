import { z } from 'zod'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { laboratorioIdActual } from '@/lib/tenant'
import type { Rol } from '@/lib/supabase/types'

export const usuarioSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['admin', 'tecnico']),
})
export type UsuarioInput = z.infer<typeof usuarioSchema>

export interface UsuarioItem {
  id: string
  nombre: string
  rol: Rol
  email: string
}

export async function listUsuarios(): Promise<UsuarioItem[]> {
  const labId = await laboratorioIdActual()
  const admin = createAdminSupabase()
  const { data: perfiles, error } = await admin
    .from('perfil')
    .select('id, nombre, rol')
    .eq('laboratorio_id', labId)
    .order('nombre', { ascending: true })
  if (error) throw new Error(error.message)

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
  const emailPorId = new Map((list?.users ?? []).map((u) => [u.id, u.email ?? '']))

  return (perfiles as { id: string; nombre: string; rol: Rol }[]).map((p) => ({
    ...p,
    email: emailPorId.get(p.id) ?? '',
  }))
}

/** Verifica que un usuario pertenezca al laboratorio del admin actual. */
async function perteneceALab(id: string, labId: string): Promise<boolean> {
  const admin = createAdminSupabase()
  const { data } = await admin
    .from('perfil')
    .select('laboratorio_id')
    .eq('id', id)
    .maybeSingle()
  return (data as { laboratorio_id: string } | null)?.laboratorio_id === labId
}

export async function crearUsuario(input: UsuarioInput): Promise<void> {
  const labId = await laboratorioIdActual()
  const admin = createAdminSupabase()

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  })
  if (error) {
    throw new Error(
      error.message.includes('already')
        ? 'Ese correo ya está registrado'
        : error.message,
    )
  }
  const userId = data.user!.id

  const { error: pErr } = await admin.from('perfil').insert({
    id: userId,
    laboratorio_id: labId,
    nombre: input.nombre,
    rol: input.rol,
  })
  if (pErr) {
    // Rollback: si falla el perfil, elimina el usuario de auth para no dejar huérfanos.
    await admin.auth.admin.deleteUser(userId)
    throw new Error(pErr.message)
  }
}

export async function cambiarRolUsuario(id: string, rol: Rol): Promise<void> {
  const labId = await laboratorioIdActual()
  if (!(await perteneceALab(id, labId))) return
  const admin = createAdminSupabase()
  const { error } = await admin.from('perfil').update({ rol }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarUsuario(id: string): Promise<void> {
  const labId = await laboratorioIdActual()
  if (!(await perteneceALab(id, labId))) return
  const admin = createAdminSupabase()
  // Al borrar el usuario de auth, su perfil se elimina en cascada (FK).
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) throw new Error(error.message)
}
