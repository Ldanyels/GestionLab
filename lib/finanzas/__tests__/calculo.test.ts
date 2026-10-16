import { describe, it, expect } from 'vitest'
import { armarResumen, margenPct, sumarGastosPorMes } from '@/lib/finanzas/calculo'

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

describe('sumarGastosPorMes', () => {
  const serie = [
    { mes: '2026-09-01', ingresos: 14360, gastos: 5120 },
    { mes: '2026-10-01', ingresos: 18190, gastos: 2260 },
  ]

  /*
    El caso real: la función de la base solo sumaba insumos y pagos, así que la
    gráfica decía S/5.120 en setiembre cuando el gasto fue S/9.585.
  */
  it('suma los gastos del mes que le corresponde', () => {
    const r = sumarGastosPorMes(serie, [
      { fecha: '2026-09-12', monto: 4000 },
      { fecha: '2026-09-30', monto: 465 },
      { fecha: '2026-10-03', monto: 3260 },
    ])
    expect(r[0]!.gastos).toBe(9585)
    expect(r[1]!.gastos).toBe(5520)
  })

  it('un mes sin gastos se queda como estaba', () => {
    const r = sumarGastosPorMes(serie, [{ fecha: '2026-10-03', monto: 100 }])
    expect(r[0]!.gastos).toBe(5120)
  })

  it('no toca los ingresos', () => {
    const r = sumarGastosPorMes(serie, [{ fecha: '2026-09-01', monto: 500 }])
    expect(r[0]!.ingresos).toBe(14360)
  })

  /* Un gasto de otro mes no debe colarse en la serie. */
  it('ignora los que caen fuera de la serie', () => {
    const r = sumarGastosPorMes(serie, [{ fecha: '2026-07-15', monto: 9999 }])
    expect(r.map((x) => x.gastos)).toEqual([5120, 2260])
  })

  it('redondea a céntimos', () => {
    const r = sumarGastosPorMes([{ mes: '2026-09-01', gastos: 0.1 }], [
      { fecha: '2026-09-02', monto: 0.2 },
    ])
    expect(r[0]!.gastos).toBe(0.3)
  })

  it('sin gastos devuelve la serie intacta', () => {
    expect(sumarGastosPorMes(serie, [])).toEqual(serie)
  })
})
