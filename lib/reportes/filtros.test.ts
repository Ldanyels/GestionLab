import { describe, it, expect } from 'vitest'
import { resolverFiltros, etiquetaRango, queryFiltros } from './filtros'

describe('resolverFiltros', () => {
  it('usa el mes actual cuando no hay fechas', () => {
    const f = resolverFiltros({})
    expect(f.desde).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(f.hasta).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(f.desde <= f.hasta).toBe(true)
  })

  it('respeta fechas válidas', () => {
    const f = resolverFiltros({ desde: '2026-01-01', hasta: '2026-03-31' })
    expect(f.desde).toBe('2026-01-01')
    expect(f.hasta).toBe('2026-03-31')
  })

  it('ignora fechas con formato inválido', () => {
    const f = resolverFiltros({ desde: '01/01/2026' })
    expect(f.desde).not.toBe('01/01/2026')
  })

  it('convierte filtros vacíos en undefined', () => {
    const f = resolverFiltros({ consultorio: '', doctor: 'd1' })
    expect(f.consultorioId).toBeUndefined()
    expect(f.doctorId).toBe('d1')
  })
})

describe('resolverFiltros · modo', () => {
  it('por defecto muestra solo lo pendiente por cobrar', () => {
    expect(resolverFiltros({}).soloPendientes).toBe(true)
  })

  it('mostrar=todos incluye los trabajos ya pagados', () => {
    expect(resolverFiltros({ mostrar: 'todos' }).soloPendientes).toBe(false)
  })
})

describe('queryFiltros', () => {
  it('conserva rango y filtros, y omite mostrar en modo pendientes', () => {
    const q = queryFiltros({
      desde: '2026-09-01',
      hasta: '2026-09-30',
      consultorioId: 'c1',
      doctorId: undefined,
      soloPendientes: true,
    })
    expect(q).toContain('desde=2026-09-01')
    expect(q).toContain('consultorio=c1')
    expect(q).not.toContain('doctor=')
    expect(q).not.toContain('mostrar=')
  })

  it('incluye mostrar=todos cuando no es solo pendientes', () => {
    const q = queryFiltros({
      desde: '2026-09-01',
      hasta: '2026-09-30',
      soloPendientes: false,
    })
    expect(q).toContain('mostrar=todos')
  })
})

describe('etiquetaRango', () => {
  it('formatea el rango en dd/mm/yyyy', () => {
    expect(etiquetaRango('2026-09-01', '2026-09-30')).toBe('01/09/2026 – 30/09/2026')
  })
})
