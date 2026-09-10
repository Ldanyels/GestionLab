import { describe, it, expect } from 'vitest'
import { lineasIniciales, totalDelCobro, validarCobro, type LineaDeCobro } from './cobro'

function linea(p: Partial<LineaDeCobro> = {}): LineaDeCobro {
  return { trabajo_id: 't1', saldo: 100, monto: 100, ...p }
}

describe('lineasIniciales', () => {
  /*
    Cada trabajo empieza con su saldo completo y **sin marcar**.

    Sin marcar porque el pago casi nunca cubre todo: si llegaran marcados, un
    descuido registraría un pago de S/1.960 cuando el consultorio dio S/200.
    Con el saldo completo porque cuando sí se marca un trabajo, lo normal es
    cobrarlo entero.
  */
  it('propone el saldo completo de cada trabajo', () => {
    const filas = lineasIniciales([
      { trabajo_id: 'a', saldo: 90 },
      { trabajo_id: 'b', saldo: 240 },
    ])
    expect(filas).toEqual([
      { trabajo_id: 'a', saldo: 90, monto: 90 },
      { trabajo_id: 'b', saldo: 240, monto: 240 },
    ])
  })
})

describe('totalDelCobro', () => {
  it('suma solo los trabajos marcados', () => {
    expect(totalDelCobro([linea({ monto: 90 }), linea({ trabajo_id: 't2', monto: 20 })])).toBe(110)
  })

  it('sin nada marcado el total es cero', () => {
    expect(totalDelCobro([])).toBe(0)
  })

  /*
    La suma se redondea a céntimos. Sin redondear, tres abonos de 33,33
    darían 99,99000000000001 y ese número acabaría impreso en un recibo.
  */
  it('redondea a céntimos', () => {
    expect(
      totalDelCobro([
        linea({ trabajo_id: 'a', monto: 33.33 }),
        linea({ trabajo_id: 'b', monto: 33.33 }),
        linea({ trabajo_id: 'c', monto: 33.33 }),
      ]),
    ).toBe(99.99)
  })
})

describe('validarCobro', () => {
  it('acepta un cobro normal', () => {
    expect(validarCobro([linea()])).toEqual({ ok: true })
  })

  it('acepta cobrar menos del saldo de un trabajo', () => {
    expect(validarCobro([linea({ saldo: 240, monto: 20 })])).toEqual({ ok: true })
  })

  it('exige marcar al menos un trabajo', () => {
    expect(validarCobro([])).toEqual({
      ok: false,
      error: 'Marca al menos un trabajo que cubra este pago',
    })
  })

  /*
    Nadie puede cobrar más de lo que un trabajo debe. Esta es la regla que
    hace imposible, por construcción, registrar un pago mayor que la deuda:
    si cada línea está topada en su saldo, la suma está topada en el total.
  */
  it('rechaza cobrar más de lo que el trabajo debe', () => {
    expect(validarCobro([linea({ saldo: 90, monto: 120 })])).toEqual({
      ok: false,
      error: 'Hay un trabajo con un importe mayor que su saldo',
    })
  })

  it('rechaza importes en cero o negativos', () => {
    expect(validarCobro([linea({ monto: 0 })]).ok).toBe(false)
    expect(validarCobro([linea({ monto: -10 })]).ok).toBe(false)
  })

  it('rechaza importes que no son números', () => {
    expect(validarCobro([linea({ monto: Number.NaN })]).ok).toBe(false)
  })

  /*
    Un céntimo de tolerancia al comparar con el saldo. Sin ella, cobrar «todo»
    un trabajo cuyo saldo salió de una división —33,333…— rebotaría por una
    diferencia que nadie puede ver ni corregir.
  */
  it('tolera un céntimo de diferencia por redondeo', () => {
    expect(validarCobro([linea({ saldo: 33.33, monto: 33.34 })]).ok).toBe(true)
    expect(validarCobro([linea({ saldo: 33.33, monto: 33.5 })]).ok).toBe(false)
  })
})
