import { describe, it, expect } from 'vitest'
import { resumenHoy, topDeuda } from './data'

const trabajos = [
  { estado: 'en_curso', fecha_entrega: '2026-09-08', saldo: 100 },
  { estado: 'en_curso', fecha_entrega: '2026-09-09', saldo: 50 },
  { estado: 'cerrado', fecha_entrega: '2026-09-08', saldo: 0 },
  { estado: 'entregado', fecha_entrega: null, saldo: 25 },
]

describe('resumenHoy', () => {
  it('cuenta las entregas del día sin importar el estado', () => {
    expect(resumenHoy(trabajos, '2026-09-08').entregasHoy).toBe(2)
  })

  it('cuenta solo los trabajos en curso', () => {
    expect(resumenHoy(trabajos, '2026-09-08').enCurso).toBe(2)
  })

  it('suma la deuda de todos los trabajos', () => {
    expect(resumenHoy(trabajos, '2026-09-08').porCobrar).toBe(175)
  })

  it('ignora saldos negativos (pagos de más)', () => {
    expect(resumenHoy([{ estado: 'cerrado', fecha_entrega: null, saldo: -30 }], '2026-09-08').porCobrar).toBe(0)
  })

  it('sin trabajos todo es cero', () => {
    expect(resumenHoy([], '2026-09-08')).toEqual({
      entregasHoy: 0,
      enCurso: 0,
      porCobrar: 0,
    })
  })
})

describe('topDeuda', () => {
  const grupos = [
    {
      consultorio_id: 'c1',
      consultorio: 'Arte oral',
      saldo: 750,
      doctores: [{ doctor: 'Ivan', filas: [1, 2, 3, 4, 5] }],
    },
    {
      consultorio_id: 'c2',
      consultorio: 'Jean',
      saldo: 470,
      doctores: [{ doctor: 'Jean', filas: [1, 2, 3] }],
    },
    {
      consultorio_id: 'c3',
      consultorio: 'Sin deuda',
      saldo: 0,
      doctores: [{ doctor: 'X', filas: [1] }],
    },
  ]

  it('devuelve los que más deben, en orden', () => {
    expect(topDeuda(grupos, 2).map((t) => t.nombre)).toEqual(['Arte oral', 'Jean'])
  })

  it('descarta a los que no deben', () => {
    expect(topDeuda(grupos, 5)).toHaveLength(2)
  })

  it('describe doctores y cantidad de trabajos', () => {
    expect(topDeuda(grupos, 1)[0].detalle).toBe('Ivan · 5 trabajos')
  })

  it('un solo trabajo va en singular', () => {
    const uno = [
      {
        consultorio_id: 'c',
        consultorio: 'A',
        saldo: 10,
        doctores: [{ doctor: 'D', filas: [1] }],
      },
    ]
    expect(topDeuda(uno, 1)[0].detalle).toBe('D · 1 trabajo')
  })

  it('sin grupos devuelve lista vacía', () => {
    expect(topDeuda([], 4)).toEqual([])
  })
})
