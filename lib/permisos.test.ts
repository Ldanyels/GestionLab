import { describe, it, expect } from 'vitest'
import { puede, veMontos, normalizarPermisos } from './permisos'
import type { Perfil } from '@/lib/supabase/types'

function perfil(p: Partial<Perfil>): Perfil {
  return {
    id: 'u1',
    laboratorio_id: 'lab1',
    nombre: 'Tec',
    rol: 'tecnico',
    permisos: [],
    ...p,
  }
}

describe('puede', () => {
  it('el admin puede todo, aunque no tenga permisos listados', () => {
    const admin = perfil({ rol: 'admin', permisos: [] })
    expect(puede(admin, 'reportes')).toBe(true)
    expect(puede(admin, 'inventario_editar')).toBe(true)
  })

  it('el técnico solo puede lo que tiene asignado', () => {
    const t = perfil({ permisos: ['reportes'] })
    expect(puede(t, 'reportes')).toBe(true)
    expect(puede(t, 'inventario_ver')).toBe(false)
  })

  it('registrar movimientos implica ver inventario', () => {
    const t = perfil({ permisos: ['inventario_editar'] })
    expect(puede(t, 'inventario_ver')).toBe(true)
  })

  it('sin sesión no puede nada', () => {
    expect(puede(null, 'reportes')).toBe(false)
  })

  it('un técnico sin permisos (o con la columna vacía) no puede', () => {
    expect(puede(perfil({}), 'reportes')).toBe(false)
    expect(puede(perfil({ permisos: undefined as unknown as [] }), 'reportes')).toBe(false)
  })
})

describe('normalizarPermisos', () => {
  it('descarta valores desconocidos', () => {
    expect(normalizarPermisos(['reportes', 'borrar_todo'])).toEqual(['reportes'])
  })

  it('agrega los permisos implicados y no repite', () => {
    expect(normalizarPermisos(['inventario_editar', 'inventario_ver'])).toEqual([
      'inventario_ver',
      'inventario_editar',
    ])
  })

  it('lista vacía se queda vacía', () => {
    expect(normalizarPermisos([])).toEqual([])
  })
})

describe('veMontos', () => {
  it('solo el admin ve importes', () => {
    expect(veMontos(perfil({ rol: 'admin' }))).toBe(true)
    expect(veMontos(perfil({ permisos: ['reportes'] }))).toBe(false)
    expect(veMontos(null)).toBe(false)
  })
})
