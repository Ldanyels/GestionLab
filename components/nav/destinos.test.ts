import { describe, it, expect } from 'vitest'
import { navItemsFor, NAV_PRINCIPAL } from './destinos'
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

  it('el admin ve los cinco destinos principales', () => {
    const labels = navItemsFor(perfil({ rol: 'admin' })).map((i) => i.label)
    expect(labels).toEqual([
      'Hoy',
      'Consultorios',
      'Trabajos',
      'Inventario',
      'Finanzas',
    ])
  })

  it('el permiso de inventario agrega esa entrada al técnico', () => {
    const labels = navItemsFor(perfil({ permisos: ['inventario_ver'] })).map((i) => i.label)
    expect(labels).toContain('Inventario')
    expect(labels).not.toContain('Finanzas')
  })
})

describe('NAV_PRINCIPAL', () => {
  it('tiene los cinco destinos del rediseño en orden', () => {
    expect(NAV_PRINCIPAL.map((i) => i.label)).toEqual([
      'Hoy',
      'Consultorios',
      'Trabajos',
      'Inventario',
      'Finanzas',
    ])
  })

  it('Configuración no está en la navegación principal', () => {
    expect(NAV_PRINCIPAL.map((i) => i.href)).not.toContain('/configuracion')
  })
})

describe('acceso a Reportes', () => {
  it('el técnico con permiso conserva su destino de Reportes', () => {
    const labels = navItemsFor(perfil({ permisos: ['reportes'] })).map((i) => i.label)
    expect(labels).toContain('Reportes')
    expect(labels.length).toBeLessThanOrEqual(5)
  })

  it('el admin llega a Reportes desde Finanzas, no por la barra', () => {
    const labels = navItemsFor(perfil({ rol: 'admin' })).map((i) => i.label)
    expect(labels).not.toContain('Reportes')
  })
})
