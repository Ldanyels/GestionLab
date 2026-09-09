import { describe, it, expect } from 'vitest'
import {
  CATALOGO_PERMISOS,
  PERMISOS,
  puede,
  puedeBorrarAbonos,
  puedeRegistrarAbonos,
  veMontos,
  veMontosReportes,
  normalizarPermisos,
} from './permisos'
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
  it('solo el admin ve importes internos (costos, márgenes)', () => {
    expect(veMontos(perfil({ rol: 'admin' }))).toBe(true)
    expect(veMontos(perfil({ permisos: ['reportes'] }))).toBe(false)
    expect(veMontos(perfil({ permisos: ['reportes_montos'] }))).toBe(false)
    expect(veMontos(null)).toBe(false)
  })
})

describe('veMontosReportes', () => {
  it('el admin siempre emite reportes con importes', () => {
    expect(veMontosReportes(perfil({ rol: 'admin' }))).toBe(true)
  })

  it('el técnico solo con el permiso de importes', () => {
    expect(veMontosReportes(perfil({ permisos: ['reportes'] }))).toBe(false)
    expect(veMontosReportes(perfil({ permisos: ['reportes_montos'] }))).toBe(true)
  })

  it('sin sesión no ve importes', () => {
    expect(veMontosReportes(null)).toBe(false)
  })
})

describe('puedeRegistrarAbonos', () => {
  it('el admin siempre puede', () => {
    expect(puedeRegistrarAbonos(perfil({ rol: 'admin' }))).toBe(true)
  })

  it('el técnico solo con el permiso de abonos', () => {
    expect(puedeRegistrarAbonos(perfil({ permisos: ['abonos_registrar'] }))).toBe(true)
    expect(puedeRegistrarAbonos(perfil({ permisos: [] }))).toBe(false)
  })

  it('otros permisos no habilitan abonos', () => {
    expect(puedeRegistrarAbonos(perfil({ permisos: ['reportes_montos'] }))).toBe(false)
    expect(puedeRegistrarAbonos(perfil({ permisos: ['inventario_editar'] }))).toBe(false)
  })

  it('sin sesión no puede', () => {
    expect(puedeRegistrarAbonos(null)).toBe(false)
  })
})

describe('puedeBorrarAbonos', () => {
  // Decisión de control de caja: registrar es delegable, borrar no. Si un
  // técnico se equivoca en el monto, el administrador lo corrige; si además
  // pudiera borrar, podría hacer desaparecer un pago cobrado.
  it('solo el administrador borra abonos', () => {
    expect(puedeBorrarAbonos(perfil({ rol: 'admin' }))).toBe(true)
    expect(puedeBorrarAbonos(perfil({ permisos: ['abonos_registrar'] }))).toBe(false)
  })

  it('sin sesión no puede', () => {
    expect(puedeBorrarAbonos(null)).toBe(false)
  })
})

describe('abonos_registrar en el catálogo', () => {
  it('está en la lista de permisos asignables', () => {
    expect(PERMISOS).toContain('abonos_registrar')
    expect(CATALOGO_PERMISOS.map((p) => p.id)).toContain('abonos_registrar')
  })

  it('tiene etiqueta y descripción para la pantalla de permisos', () => {
    const info = CATALOGO_PERMISOS.find((p) => p.id === 'abonos_registrar')
    expect(info?.etiqueta).toBeTruthy()
    expect(info?.descripcion).toBeTruthy()
  })

  it('no implica ningún otro permiso', () => {
    expect(normalizarPermisos(['abonos_registrar'])).toEqual(['abonos_registrar'])
  })

  it('el catálogo cubre todos los permisos existentes', () => {
    expect(CATALOGO_PERMISOS.map((p) => p.id).sort()).toEqual([...PERMISOS].sort())
  })
})

describe('reportes_montos implica reportes', () => {
  it('quien puede emitir con importes también entra a reportes', () => {
    const t = perfil({ permisos: ['reportes_montos'] })
    expect(puede(t, 'reportes')).toBe(true)
  })

  it('normalizar agrega el permiso implicado', () => {
    expect(normalizarPermisos(['reportes_montos'])).toEqual([
      'reportes',
      'reportes_montos',
    ])
  })
})
