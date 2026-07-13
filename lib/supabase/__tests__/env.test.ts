import { describe, it, expect } from 'vitest'
import { readSupabaseEnv } from '@/lib/supabase/client'

describe('readSupabaseEnv', () => {
  it('lanza error claro si falta la URL', () => {
    expect(() => readSupabaseEnv({ url: '', anonKey: 'x' })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    )
  })
  it('lanza error claro si falta la clave', () => {
    expect(() => readSupabaseEnv({ url: 'u', anonKey: '' })).toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    )
  })
  it('devuelve las claves cuando existen', () => {
    expect(readSupabaseEnv({ url: 'u', anonKey: 'k' })).toEqual({
      url: 'u',
      anonKey: 'k',
    })
  })
})
