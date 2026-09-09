import { describe, it, expect } from 'vitest'
import {
  contarPorPago,
  ETIQUETA_FILTRO_PAGO,
  filtrarPorPago,
  FILTROS_PAGO,
  resolverFiltroPago,
} from './pago'

const lista = [
  { id: 'debe-todo', saldo: 90 },
  { id: 'debe-parte', saldo: 30 },
  { id: 'pagado', saldo: 0 },
  { id: 'pago-de-mas', saldo: -20 },
  { id: 'centimos', saldo: 0.0005 },
]

describe('resolverFiltroPago', () => {
  it('acepta los filtros conocidos', () => {
    for (const f of FILTROS_PAGO) expect(resolverFiltroPago(f)).toBe(f)
  })

  it('cualquier otra cosa cae en "cualquiera"', () => {
    expect(resolverFiltroPago(undefined)).toBe('cualquiera')
    expect(resolverFiltroPago('')).toBe('cualquiera')
    expect(resolverFiltroPago('parcial')).toBe('cualquiera')
    expect(resolverFiltroPago('; DROP')).toBe('cualquiera')
  })
})

describe('filtrarPorPago', () => {
  it('"cualquiera" devuelve todo', () => {
    expect(filtrarPorPago(lista, 'cualquiera')).toHaveLength(5)
  })

  it('"por_cobrar" deja los que tienen saldo, hayan abonado algo o nada', () => {
    expect(filtrarPorPago(lista, 'por_cobrar').map((t) => t.id)).toEqual([
      'debe-todo',
      'debe-parte',
    ])
  })

  it('"pagados" deja los que no deben nada', () => {
    expect(filtrarPorPago(lista, 'pagados').map((t) => t.id)).toEqual([
      'pagado',
      'pago-de-mas',
      'centimos',
    ])
  })

  // Un saldo de una diezmilésima de sol es un residuo de redondeo, no una
  // deuda: se cuenta como pagado, igual que en el resto del sistema.
  it('un saldo por debajo de un milésimo cuenta como pagado', () => {
    expect(filtrarPorPago(lista, 'pagados').map((t) => t.id)).toContain('centimos')
    expect(filtrarPorPago(lista, 'por_cobrar').map((t) => t.id)).not.toContain('centimos')
  })

  it('un pago en exceso cuenta como pagado, no como deuda negativa', () => {
    expect(filtrarPorPago(lista, 'pagados').map((t) => t.id)).toContain('pago-de-mas')
  })

  it('no muta la lista original', () => {
    const copia = [...lista]
    filtrarPorPago(lista, 'pagados')
    expect(lista).toEqual(copia)
  })

  it('lista vacía devuelve lista vacía', () => {
    expect(filtrarPorPago([], 'por_cobrar')).toEqual([])
  })
})

describe('contarPorPago', () => {
  it('cuenta cada filtro para las pastillas', () => {
    expect(contarPorPago(lista)).toEqual({ cualquiera: 5, por_cobrar: 2, pagados: 3 })
  })

  it('sin trabajos todo es cero', () => {
    expect(contarPorPago([])).toEqual({ cualquiera: 0, por_cobrar: 0, pagados: 0 })
  })

  it('los dos filtros suman el total: ningún trabajo se queda fuera', () => {
    const c = contarPorPago(lista)
    expect(c.por_cobrar + c.pagados).toBe(c.cualquiera)
  })
})

describe('ETIQUETA_FILTRO_PAGO', () => {
  it('tiene etiqueta para cada filtro', () => {
    for (const f of FILTROS_PAGO) expect(ETIQUETA_FILTRO_PAGO[f]).toBeTruthy()
  })
})
