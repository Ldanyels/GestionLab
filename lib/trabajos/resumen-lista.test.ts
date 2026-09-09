import { describe, it, expect } from 'vitest'
import { resumenLista } from './resumen-lista'

describe('resumenLista', () => {
  const conDeuda = [{ saldo: 90 }, { saldo: 30 }, { saldo: 0 }]
  const todoCobrado = [{ saldo: 0 }, { saldo: -5 }]

  it('cuenta los trabajos del resultado filtrado', () => {
    expect(resumenLista(conDeuda, true).conteo).toBe('3 trabajos')
  })

  it('usa el singular con un solo trabajo', () => {
    expect(resumenLista([{ saldo: 10 }], true).conteo).toBe('1 trabajo')
  })

  // El punto del rediseño: la barra de filtros contaba trabajos, y lo que el
  // dueño necesita saber al filtrar «entregados por cobrar» es cuánto es.
  it('suma cuánto queda por cobrar en lo filtrado', () => {
    const r = resumenLista(conDeuda, true)
    expect(r.monto).toBe('S/ 120.00 por cobrar')
    expect(r.hayDeuda).toBe(true)
  })

  it('lo dice en palabras cuando no queda nada por cobrar', () => {
    const r = resumenLista(todoCobrado, true)
    expect(r.monto).toBe('todo cobrado')
    expect(r.hayDeuda).toBe(false)
  })

  it('ignora los saldos negativos: un pago de más no resta deuda ajena', () => {
    expect(resumenLista([{ saldo: 100 }, { saldo: -40 }], true).monto).toBe(
      'S/ 100.00 por cobrar',
    )
  })

  it('trata los residuos de redondeo como cobrado', () => {
    expect(resumenLista([{ saldo: 0.0005 }], true).hayDeuda).toBe(false)
  })

  it('al técnico que no ve importes solo le da el conteo', () => {
    const r = resumenLista(conDeuda, false)
    expect(r.conteo).toBe('3 trabajos')
    expect(r.monto).toBeNull()
  })

  it('sin resultados no dice nada: de eso se encarga el estado vacío', () => {
    expect(resumenLista([], true)).toEqual({ conteo: '', monto: null, hayDeuda: false })
    expect(resumenLista([], false)).toEqual({ conteo: '', monto: null, hayDeuda: false })
  })

  it('redondea a dos decimales sin arrastrar errores de coma flotante', () => {
    expect(resumenLista([{ saldo: 0.1 }, { saldo: 0.2 }], true).monto).toBe('S/ 0.30 por cobrar')
  })

  it('separa los miles para que se lea de un vistazo', () => {
    expect(resumenLista([{ saldo: 4320 }], true).monto).toBe('S/ 4,320.00 por cobrar')
  })
})
