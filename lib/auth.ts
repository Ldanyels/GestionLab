import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import type { Perfil, Rol } from '@/lib/supabase/types'

export function requireRol(perfil: Perfil | null, roles: Rol[]): boolean {
  return perfil !== null && roles.includes(perfil.rol)
}

export interface SessionContext {
  userId: string | null
  perfil: Perfil | null
  /** Mensaje de error de la consulta a `perfil`, si lo hubo (para diagnóstico). */
  error: string | null
}

export async function getSessionContext(): Promise<SessionContext> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { userId: null, perfil: null, error: null }

  const { data, error } = await supabase
    .from('perfil')
    .select('id, laboratorio_id, nombre, rol')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[getSessionContext] error leyendo perfil:', error)
    return { userId: user.id, perfil: null, error: error.message }
  }
  return { userId: user.id, perfil: (data as Perfil) ?? null, error: null }
}

export async function getSessionPerfil(): Promise<Perfil | null> {
  const { perfil } = await getSessionContext()
  return perfil
}

/** Exige rol admin: redirige si no hay sesión o el rol no es admin. */
export async function requireAdmin(): Promise<Perfil> {
  const { perfil } = await getSessionContext()
  if (!perfil) redirect('/login')
  if (perfil.rol !== 'admin') redirect('/hoy')
  return perfil
}
