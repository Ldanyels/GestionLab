import { describe, it, expect } from 'vitest'
import { requireRol } from '@/lib/auth'
import type { Perfil } from '@/lib/supabase/types'

const admin: Perfil = { id: '1', laboratorio_id: 'l', nombre: 'A', rol: 'admin' }
const tec: Perfil = { ...admin, rol: 'tecnico' }

describe('requireRol', () => {
  it('permite al admin en rutas de admin', () => {
    expect(requireRol(admin, ['admin'])).toBe(true)
  })
  it('rechaza al técnico en rutas de admin', () => {
    expect(requireRol(tec, ['admin'])).toBe(false)
  })
  it('permite a ambos roles en rutas compartidas', () => {
    expect(requireRol(tec, ['admin', 'tecnico'])).toBe(true)
  })
  it('rechaza si no hay perfil', () => {
    expect(requireRol(null, ['admin', 'tecnico'])).toBe(false)
  })
})
