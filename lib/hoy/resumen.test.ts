import { describe, it, expect } from 'vitest'
import { topDeuda } from './data'


describe('topDeuda', () => {
  const cuentas = [
    { consultorio_id: 'c1', consultorio: 'Arte oral', doctores: 2, trabajos: 5, saldo: 750 },
    { consultorio_id: 'c2', consultorio: 'Jean', doctores: 1, trabajos: 3, saldo: 470 },
    { consultorio_id: 'c3', consultorio: 'Sin deuda', doctores: 1, trabajos: 1, saldo: 0 },
  ]

  it('devuelve los que más deben, en orden', () => {
    expect(topDeuda(cuentas, 2).map((t) => t.nombre)).toEqual(['Arte oral', 'Jean'])
  })

  it('descarta a los que no deben', () => {
    expect(topDeuda(cuentas, 5)).toHaveLength(2)
  })

  it('describe doctores y cantidad de trabajos', () => {
    expect(topDeuda(cuentas, 1)[0].detalle).toBe('2 doctores · 5 trabajos')
  })

  it('usa el singular cuando corresponde', () => {
    const uno = [
      { consultorio_id: 'c', consultorio: 'A', doctores: 1, trabajos: 1, saldo: 10 },
    ]
    expect(topDeuda(uno, 1)[0].detalle).toBe('1 doctor · 1 trabajo')
  })

  it('sin cuentas devuelve lista vacía', () => {
    expect(topDeuda([], 4)).toEqual([])
  })
})
