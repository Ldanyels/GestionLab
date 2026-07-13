import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { readSupabaseEnv } from './client'

export async function createServerSupabase() {
  const { url, anonKey } = readSupabaseEnv({})
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Server Component: la escritura de cookies se ignora (la maneja el middleware).
        }
      },
    },
  })
}
