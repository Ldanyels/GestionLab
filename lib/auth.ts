import { createServerSupabase } from '@/lib/supabase/server'
import type { Perfil, Rol } from '@/lib/supabase/types'

export function requireRol(perfil: Perfil | null, roles: Rol[]): boolean {
  return perfil !== null && roles.includes(perfil.rol)
}

export async function getSessionPerfil(): Promise<Perfil | null> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('perfil')
    .select('id, laboratorio_id, nombre, rol')
    .eq('id', user.id)
    .single()
  return (data as Perfil) ?? null
}
