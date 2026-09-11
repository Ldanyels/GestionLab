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

describe('armarResumen con gastos de operación', () => {
  /*
    La luz, el agua y el alquiler entran en la utilidad. Antes de que existiera
    esta línea, un laboratorio que pagaba S/480 de servicios veía una utilidad
    S/480 más alta de la real, todos los meses.
  */
  it('resta los gastos de operación de la utilidad', () => {
    const r = armarResumen({ ingresos: 1000, materiales: 200, pagos: 300, operativos: 150 })
    expect(r.operativos).toBe(150)
    expect(r.gastos).toBe(650)
    expect(r.utilidad).toBe(350)
  })

  /*
    Sin gastos registrados el resultado es el de siempre. Importa porque la
    función se llamaba desde sitios que no los pasan, y un `undefined` sumado
    habría convertido la utilidad en NaN —un guion en pantalla donde debería
    haber dinero.
  */
  it('sin gastos de operación, el resultado no cambia', () => {
    const r = armarResumen({ ingresos: 1000, materiales: 200, pagos: 300 })
    expect(r.operativos).toBe(0)
    expect(r.gastos).toBe(500)
    expect(r.utilidad).toBe(500)
  })

  it('los gastos de operación pueden dejar la utilidad en negativo', () => {
    const r = armarResumen({ ingresos: 500, materiales: 100, pagos: 200, operativos: 400 })
    expect(r.utilidad).toBe(-200)
  })

  it('redondea a céntimos', () => {
    const r = armarResumen({ ingresos: 100, materiales: 33.33, pagos: 33.33, operativos: 33.33 })
    expect(r.gastos).toBe(99.99)
    expect(r.utilidad).toBe(0.01)
  })
})
