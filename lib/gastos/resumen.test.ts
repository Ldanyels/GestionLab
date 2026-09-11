import { describe, it, expect } from 'vitest'
import { resumenDeGastos, type GastoResumible } from './resumen'

function gasto(p: Partial<GastoResumible>): GastoResumible {
  return { categoria: 'servicio', concepto: 'Luz', monto: 100, ...p }
}

describe('resumenDeGastos', () => {
  it('suma por categoría', () => {
    const r = resumenDeGastos([
      gasto({ categoria: 'servicio', monto: 220 }),
      gasto({ categoria: 'servicio', monto: 90 }),
      gasto({ categoria: 'equipo', monto: 350 }),
    ])
    expect(r.porCategoria.servicio).toBe(310)
    expect(r.porCategoria.equipo).toBe(350)
    expect(r.porCategoria.otro).toBe(0)
    expect(r.total).toBe(660)
  })

  /*
    Las categorías sin gasto aparecen en cero y no se omiten. Un resumen donde
    «Equipo» desaparece el mes que no hubo compras obliga a recordar si es que
    no hubo o si es que no se registró.
  */
  it('sin gastos, las tres categorías están y valen cero', () => {
    const r = resumenDeGastos([])
    expect(r.porCategoria).toEqual({ servicio: 0, equipo: 0, otro: 0 })
    expect(r.total).toBe(0)
    expect(r.detalle).toEqual([])
  })

  /*
    Dentro de cada categoría se agrupa por concepto, porque la pregunta real no
    es «cuánto gasté en servicios» sino «cuánto me está costando la luz». Dos
    recibos de luz en el mismo mes tienen que sumarse en una sola línea.
  */
  it('agrupa por concepto dentro de la categoría', () => {
    const r = resumenDeGastos([
      gasto({ concepto: 'Luz', monto: 220 }),
      gasto({ concepto: 'Luz', monto: 30 }),
      gasto({ concepto: 'Agua', monto: 90 }),
    ])
    const servicios = r.detalle.filter((d) => d.categoria === 'servicio')
    expect(servicios).toEqual([
      { categoria: 'servicio', concepto: 'Luz', monto: 250, veces: 2 },
      { categoria: 'servicio', concepto: 'Agua', monto: 90, veces: 1 },
    ])
  })

  /*
    «luz» y «Luz» son el mismo gasto. Sin unificar, el resumen mostraría dos
    líneas de luz y la pregunta «cuánto me cuesta la luz» seguiría sin
    respuesta.
  */
  it('une conceptos que solo difieren en mayúsculas o espacios', () => {
    const r = resumenDeGastos([
      gasto({ concepto: 'Luz', monto: 100 }),
      gasto({ concepto: '  luz ', monto: 50 }),
    ])
    expect(r.detalle).toHaveLength(1)
    expect(r.detalle[0]).toEqual({
      categoria: 'servicio',
      // Se conserva la escritura de la primera aparición, no la normalizada:
      // «Luz» se lee mejor que «luz» en un resumen.
      concepto: 'Luz',
      monto: 150,
      veces: 2,
    })
  })

  it('ordena de mayor a menor dentro de cada categoría', () => {
    const r = resumenDeGastos([
      gasto({ concepto: 'Agua', monto: 90 }),
      gasto({ concepto: 'Luz', monto: 220 }),
      gasto({ concepto: 'Internet', monto: 170 }),
    ])
    expect(r.detalle.map((d) => d.concepto)).toEqual(['Luz', 'Internet', 'Agua'])
  })

  it('las categorías salen en orden: servicios, equipo, otros', () => {
    const r = resumenDeGastos([
      gasto({ categoria: 'otro', concepto: 'Varios', monto: 1000 }),
      gasto({ categoria: 'equipo', concepto: 'Motor', monto: 500 }),
      gasto({ categoria: 'servicio', concepto: 'Luz', monto: 10 }),
    ])
    expect(r.detalle.map((d) => d.categoria)).toEqual(['servicio', 'equipo', 'otro'])
  })

  it('redondea a céntimos', () => {
    const r = resumenDeGastos([
      gasto({ concepto: 'A', monto: 33.33 }),
      gasto({ concepto: 'A', monto: 33.33 }),
      gasto({ concepto: 'A', monto: 33.33 }),
    ])
    expect(r.total).toBe(99.99)
  })
})
