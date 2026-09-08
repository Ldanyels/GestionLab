import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { puede, type Permiso } from '@/lib/permisos'
import { estaSuspendido } from '@/lib/laboratorio/estado'
import type { Perfil, Rol } from '@/lib/supabase/types'

export function requireRol(perfil: Perfil | null, roles: Rol[]): boolean {
  return perfil !== null && roles.includes(perfil.rol)
}

/** Lo que hace falta saber de la cuenta del laboratorio en cada petición. */
export interface CuentaLaboratorio {
  estado: string | null
  plan: string | null
}

export interface SessionContext {
  userId: string | null
  perfil: Perfil | null
  /** Cuenta del laboratorio del usuario. `null` si no se pudo leer. */
  laboratorio: CuentaLaboratorio | null
  /** Mensaje de error de la consulta a `perfil`, si lo hubo (para diagnóstico). */
  error: string | null
}

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

/**
 * Selecciones a probar, de la más completa a la más básica.
 *
 * Una migración pendiente no debe dejar a nadie fuera del sistema: ya pasó una
 * vez, cuando faltaba `perfil.permisos` y el error se tragaba silenciosamente.
 * Se intenta en orden y gana la primera que responde; en el caso normal la
 * primera funciona y es una sola consulta.
 */
const SELECCIONES = [
  'id, laboratorio_id, nombre, rol, permisos, laboratorio(estado, plan)',
  'id, laboratorio_id, nombre, rol, permisos',
  'id, laboratorio_id, nombre, rol',
] as const

type FilaCruda = Omit<Perfil, 'permisos'> & {
  permisos?: string[] | null
  laboratorio?: { estado?: string | null; plan?: string | null } | Array<{
    estado?: string | null
    plan?: string | null
  }> | null
}

/**
 * Normaliza el laboratorio incrustado. PostgREST devuelve un objeto para una
 * relación de muchos a uno, pero según cómo infiera la relación puede llegar
 * como arreglo de un elemento; se aceptan las dos formas.
 */
function laboratorioDe(fila: FilaCruda | null): CuentaLaboratorio | null {
  const bruto = fila?.laboratorio
  if (!bruto) return null
  const uno = Array.isArray(bruto) ? bruto[0] : bruto
  if (!uno) return null
  return { estado: uno.estado ?? null, plan: uno.plan ?? null }
}

/**
 * Sesión, perfil y cuenta del laboratorio, **memoizado por petición** con
 * `cache()`.
 *
 * Sin esto, cada navegación consultaba a Supabase varias veces: el layout, la
 * página y los helpers de datos llamaban aquí por separado, y cada llamada
 * costaba dos viajes de red (validar el token y leer el perfil). Con `cache()`
 * el primero paga el costo y el resto reutiliza el resultado.
 */
export const getSessionContext = cache(async function getSessionContext(): Promise<SessionContext> {
  const supabase = await createServerSupabase()
  const userId = await idUsuario(supabase)
  if (!userId) return { userId: null, perfil: null, laboratorio: null, error: null }

  let fila: FilaCruda | null = null
  let error: { message: string; code?: string } | null = null

  for (const seleccion of SELECCIONES) {
    const intento = await supabase.from('perfil').select(seleccion).eq('id', userId).maybeSingle()
    if (!intento.error) {
      fila = intento.data as FilaCruda | null
      error = null
      break
    }
    error = intento.error
    console.warn(
      `[getSessionContext] la selección "${seleccion}" falló (${intento.error.code}); se prueba una más básica`,
    )
  }

  if (error) {
    console.error('[getSessionContext] error leyendo perfil:', error)
    return { userId, perfil: null, laboratorio: null, error: error.message }
  }

  return {
    userId,
    perfil: fila ? { ...fila, permisos: fila.permisos ?? [] } : null,
    laboratorio: laboratorioDe(fila),
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

/**
 * Corta el acceso de un laboratorio suspendido en los manejadores de ruta
 * (exportaciones CSV y PDF), que no pasan por `app/(app)/layout.tsx` y por
 * tanto no ven la pantalla de cuenta suspendida.
 *
 * Devuelve la respuesta a retornar, o `null` si puede continuar:
 *
 *   const bloqueo = await respuestaSiSuspendido()
 *   if (bloqueo) return bloqueo
 *
 * Se devuelve un 403 y no un `redirect()` a propósito: estas rutas se abren en
 * una pestaña nueva o las consume una descarga, y una redirección ahí termina
 * en un archivo con el HTML de otra página dentro.
 */
export async function respuestaSiSuspendido(): Promise<Response | null> {
  const { laboratorio } = await getSessionContext()
  if (!estaSuspendido(laboratorio)) return null
  return new Response(
    'La cuenta del laboratorio está suspendida. Regulariza el pago para volver a exportar.',
    { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8' } },
  )
}
