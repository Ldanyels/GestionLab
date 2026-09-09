import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * ¿Este correo administra la plataforma?
 *
 * La lista vive en la variable de entorno `SUPERADMIN_EMAILS` y no en una fila
 * de la base, a propósito. Si el rol fuera un dato, un fallo de la clase de
 * `perfil_self_insert` —el agujero que cerró la migración 0018— podría
 * **otorgarlo**. Una variable de entorno no se escala desde SQL.
 *
 * `lista` se recibe por parámetro para poder probar la función sin tocar el
 * entorno del proceso.
 */
export function esSuperAdmin(
  email: string | null | undefined,
  lista: string | undefined = process.env.SUPERADMIN_EMAILS,
): boolean {
  const buscado = email?.trim().toLowerCase()
  if (!buscado) return false

  const permitidos = (lista ?? '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)

  // Sin configuración nadie entra: la ausencia de una lista no puede
  // interpretarse como "todos".
  if (permitidos.length === 0) return false

  return permitidos.includes(buscado)
}

/**
 * Correo del usuario de la sesión.
 *
 * Se toma del claim `email`, que ya se verifica localmente en cada petición,
 * con respaldo en `getUser()` si la verificación local no está disponible. Es
 * el mismo patrón que `idUsuario` en `lib/auth.ts`, para no añadir un viaje de
 * red por navegación.
 */
export async function correoSesion(): Promise<string | null> {
  const supabase = await createServerSupabase()
  try {
    const { data, error } = await supabase.auth.getClaims()
    const email = data?.claims?.email
    if (!error && typeof email === 'string') return email
  } catch {
    // Sin verificación local disponible: se usa el respaldo por red.
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.email ?? null
}

export async function esSesionSuperAdmin(): Promise<boolean> {
  return esSuperAdmin(await correoSesion())
}

/** Exige rol de plataforma. Manda a /hoy a cualquier otro. */
export async function requireSuperAdmin(): Promise<void> {
  if (!(await esSesionSuperAdmin())) redirect('/hoy')
}
