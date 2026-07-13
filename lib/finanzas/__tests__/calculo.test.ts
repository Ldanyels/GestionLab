import { describe, it, expect } from 'vitest'
import { armarResumen, margenPct } from '@/lib/finanzas/calculo'

describe('armarResumen', () => {
  it('suma gastos y calcula utilidad', () => {
    const r = armarResumen({ ingresos: 1000, materiales: 200, pagos: 300 })
    expect(r.gastos).toBe(500)
    expect(r.utilidad).toBe(500)
  })
  it('utilidad negativa cuando gastos superan ingresos', () => {
    const r = armarResumen({ ingresos: 100, materiales: 80, pagos: 60 })
    expect(r.utilidad).toBe(-40)
  })
})

describe('margenPct', () => {
  it('calcula el margen sobre ingresos', () => {
    expect(margenPct(armarResumen({ ingresos: 1000, materiales: 200, pagos: 300 }))).toBe(50)
  })
  it('0% sin ingresos', () => {
    expect(margenPct(armarResumen({ ingresos: 0, materiales: 0, pagos: 0 }))).toBe(0)
  })
})
