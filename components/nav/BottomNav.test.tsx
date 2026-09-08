import { describe, it, expect } from 'vitest'
import { navItemsFor } from './BottomNav'
import type { Perfil } from '@/lib/supabase/types'

function perfil(p: Partial<Perfil>): Perfil {
  return {
    id: '1',
    laboratorio_id: 'l',
    nombre: 'A',
    rol: 'tecnico',
    permisos: [],
    ...p,
  }
}

describe('navItemsFor', () => {
  it('el técnico sin permisos ve Hoy, Consultorios y Trabajos', () => {
    const labels = navItemsFor(perfil({})).map((i) => i.label)
    expect(labels).toContain('Hoy')
    expect(labels).toContain('Consultorios')
    expect(labels).toContain('Trabajos')
    expect(labels).not.toContain('Finanzas')
    expect(labels).not.toContain('Inventario')
    expect(labels).not.toContain('Reportes')
  })

  it('el admin ve todo menos la entrada de Reportes (la abre desde Finanzas)', () => {
    const labels = navItemsFor(perfil({ rol: 'admin' })).map((i) => i.label)
    expect(labels).toEqual(
      expect.arrayContaining([
        'Hoy',
        'Consultorios',
        'Trabajos',
        'Inventario',
        'Finanzas',
      ]),
    )
  })

  it('el permiso de reportes agrega esa entrada al técnico', () => {
    const labels = navItemsFor(perfil({ permisos: ['reportes'] })).map((i) => i.label)
    expect(labels).toContain('Reportes')
    expect(labels).not.toContain('Inventario')
  })

  it('el permiso de inventario agrega esa entrada al técnico', () => {
    const labels = navItemsFor(perfil({ permisos: ['inventario_ver'] })).map(
      (i) => i.label,
    )
    expect(labels).toContain('Inventario')
    expect(labels).not.toContain('Finanzas')
  })
})
