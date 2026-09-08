import { describe, it, expect } from 'vitest'
import { resumenHoy, topDeuda } from './data'

const trabajos = [
  { estado: 'en_curso', fecha_ingreso: '2026-09-08', fecha_entrega: '2026-09-08', saldo: 100 },
  { estado: 'en_curso', fecha_ingreso: '2026-09-08', fecha_entrega: '2026-09-09', saldo: 50 },
  { estado: 'cerrado', fecha_ingreso: '2026-09-07', fecha_entrega: '2026-09-08', saldo: 0 },
  { estado: 'entregado', fecha_ingreso: '2026-09-07', fecha_entrega: null, saldo: 25 },
]

describe('resumenHoy', () => {
  // El contador que de verdad se puede llenar: `fecha_ingreso` la pone la base
  // sola, a diferencia de `fecha_entrega`, que en MasterLab está vacía en todos
  // los trabajos.
  it('cuenta los trabajos que ingresaron hoy, sin importar el estado', () => {
    expect(resumenHoy(trabajos, '2026-09-08').ingresadosHoy).toBe(2)
    expect(resumenHoy(trabajos, '2026-09-07').ingresadosHoy).toBe(2)
  })

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
    expect(
      resumenHoy(
        [{ estado: 'cerrado', fecha_ingreso: '2026-09-08', fecha_entrega: null, saldo: -30 }],
        '2026-09-08',
      ).porCobrar,
    ).toBe(0)
  })

  it('sin trabajos todo es cero', () => {
    expect(resumenHoy([], '2026-09-08')).toEqual({
      ingresadosHoy: 0,
      entregasHoy: 0,
      enCurso: 0,
      porCobrar: 0,
    })
  })
})

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
