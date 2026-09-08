import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { puede, type Permiso } from '@/lib/permisos'
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

/**
 * Sesión y perfil del usuario, **memoizado por petición** con `cache()`.
 *
 * Sin esto, cada navegación consultaba a Supabase varias veces: el layout, la
 * página y los helpers de datos llamaban aquí por separado, y cada llamada
 * costaba dos viajes de red (validar el token y leer el perfil). Con `cache()`
 * el primero paga el costo y el resto reutiliza el resultado.
 */
/**
 * Id del usuario autenticado.
 *
 * Prefiere `getClaims()`, que verifica la firma del token en el propio
 * servidor; `getUser()` pregunta a Supabase por red y eso cuesta cientos de
 * milisegundos en cada navegación. Si el proyecto no permite verificación
 * local, se cae a `getUser()` sin cambiar el comportamiento.
 */
async function idUsuario(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getClaims()
    const sub = data?.claims?.sub
    if (!error && typeof sub === 'string') return sub
  } catch {
    // Sin verificación local disponible: se usa el respaldo por red.
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export const getSessionContext = cache(async function getSessionContext(): Promise<SessionContext> {
  const supabase = await createServerSupabase()
  const userId = await idUsuario(supabase)
  if (!userId) return { userId: null, perfil: null, error: null }
  const user = { id: userId }

  type Fila = Omit<Perfil, 'permisos'> & { permisos?: string[] | null }

  const principal = await supabase
    .from('perfil')
    .select('id, laboratorio_id, nombre, rol, permisos')
    .eq('id', user.id)
    .maybeSingle()

  let fila = principal.data as Fila | null
  let error = principal.error

  // Si la migración de permisos aún no se ejecutó (columna inexistente, 42703),
  // se lee el perfil sin ella: una migración pendiente no debe dejar a nadie
  // fuera del sistema. Los permisos quedan vacíos hasta aplicarla.
  if (error?.code === '42703') {
    console.warn('[getSessionContext] falta perfil.permisos (migración 0016 pendiente)')
    const respaldo = await supabase
      .from('perfil')
      .select('id, laboratorio_id, nombre, rol')
      .eq('id', user.id)
      .maybeSingle()
    fila = respaldo.data as Fila | null
    error = respaldo.error
  }

  if (error) {
    console.error('[getSessionContext] error leyendo perfil:', error)
    return { userId: user.id, perfil: null, error: error.message }
  }
  return {
    userId: user.id,
    perfil: fila ? { ...fila, permisos: fila.permisos ?? [] } : null,
    error: null,
  }
})

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

/** Exige un permiso concreto (el admin siempre pasa). */
export async function requirePermiso(permiso: Permiso): Promise<Perfil> {
  const { perfil } = await getSessionContext()
  if (!perfil) redirect('/login')
  if (!puede(perfil, permiso)) redirect('/hoy')
  return perfil
}
