import { describe, it, expect } from 'vitest'
import { navItemsFor } from './BottomNav'

describe('navItemsFor', () => {
  it('el técnico ve Hoy, Consultorios y Trabajos, pero no Finanzas ni Inventario', () => {
    const labels = navItemsFor('tecnico').map((i) => i.label)
    expect(labels).toContain('Hoy')
    expect(labels).toContain('Consultorios')
    expect(labels).toContain('Trabajos')
    expect(labels).not.toContain('Finanzas')
    expect(labels).not.toContain('Inventario')
  })
  it('el admin ve todo', () => {
    const labels = navItemsFor('admin').map((i) => i.label)
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
})
