import { z } from 'zod'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { laboratorioIdActual } from '@/lib/tenant'
import { normalizarPermisos } from '@/lib/permisos'
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
  permisos: string[]
}

export async function listUsuarios(): Promise<UsuarioItem[]> {
  const labId = await laboratorioIdActual()
  const admin = createAdminSupabase()
  type Fila = { id: string; nombre: string; rol: Rol; permisos?: string[] | null }

  const principal = await admin
    .from('perfil')
    .select('id, nombre, rol, permisos')
    .eq('laboratorio_id', labId)
    .order('nombre', { ascending: true })

  let perfiles = principal.data as Fila[] | null
  let error = principal.error

  // Migración de permisos pendiente (42703): lista sin ellos.
  if (error?.code === '42703') {
    const respaldo = await admin
      .from('perfil')
      .select('id, nombre, rol')
      .eq('laboratorio_id', labId)
      .order('nombre', { ascending: true })
    perfiles = respaldo.data as Fila[] | null
    error = respaldo.error
  }
  if (error) throw new Error(error.message)

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
  const emailPorId = new Map((list?.users ?? []).map((u) => [u.id, u.email ?? '']))

  return (perfiles ?? []).map((p) => ({
    ...p,
    permisos: p.permisos ?? [],
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

/** Reemplaza los permisos de un usuario del mismo laboratorio. */
export async function guardarPermisosUsuario(
  id: string,
  permisos: readonly string[],
): Promise<void> {
  const labId = await laboratorioIdActual()
  if (!(await perteneceALab(id, labId))) return
  const admin = createAdminSupabase()
  const { error } = await admin
    .from('perfil')
    .update({ permisos: normalizarPermisos(permisos) })
    .eq('id', id)
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

/**
 * Fija una contraseña nueva para un usuario del propio laboratorio.
 *
 * El administrador la escribe y se aplica de inmediato. Es coherente con
 * `crearUsuario`, donde el administrador también fija la contraseña inicial, y
 * con un laboratorio de pocas personas donde el técnico está presente.
 *
 * `perteneceALab` es la barrera real, no un adorno: sin ella un administrador
 * podría cambiarle la contraseña a un usuario de OTRO laboratorio con solo
 * pasar su identificador, porque la clave de servicio omite RLS por diseño.
 * Si no pertenece, se sale en silencio: no se confirma ni se niega que ese
 * identificador exista.
 */
export async function restablecerClave(id: string, password: string): Promise<void> {
  const labId = await laboratorioIdActual()
  if (!(await perteneceALab(id, labId))) return

  const admin = createAdminSupabase()
  const { error } = await admin.auth.admin.updateUserById(id, { password })
  if (error) throw new Error(error.message)
}
