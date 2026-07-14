import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con clave secreta (service role) — SOLO servidor.
 * Se usa para tareas administrativas como crear usuarios. Nunca exponer al cliente.
 */
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL')
  if (!key) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local (clave secreta de Supabase). Es necesaria para crear usuarios.',
    )
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
