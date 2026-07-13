import { createBrowserClient } from '@supabase/ssr'

export interface SupabaseEnv {
  url: string
  anonKey: string
}

export function readSupabaseEnv(input: {
  url?: string
  anonKey?: string
}): SupabaseEnv {
  const url = input.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = input.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL')
  if (!anonKey) throw new Error('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return { url, anonKey }
}

export function createBrowserSupabase() {
  const { url, anonKey } = readSupabaseEnv({})
  return createBrowserClient(url, anonKey)
}
