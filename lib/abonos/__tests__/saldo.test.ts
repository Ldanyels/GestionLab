import { describe, it, expect } from 'vitest'
import { totalPagado, saldoPendiente, estadoPago } from '@/lib/abonos/saldo'

const abonos = [{ monto: 50 }, { monto: 30 }]

describe('totalPagado', () => {
  it('suma los abonos', () => {
    expect(totalPagado(abonos)).toBe(80)
    expect(totalPagado([])).toBe(0)
  })
})

describe('saldoPendiente', () => {
  it('resta lo pagado del precio', () => {
    expect(saldoPendiente(90, abonos)).toBe(10)
  })
  it('llega a 0 cuando se cubre el total', () => {
    expect(saldoPendiente(80, abonos)).toBe(0)
  })
})

describe('estadoPago', () => {
  it('pendiente sin pagos', () => {
    expect(estadoPago(90, 0)).toBe('pendiente')
  })
  it('parcial cuando falta', () => {
    expect(estadoPago(90, 80)).toBe('parcial')
  })
  it('pagado cuando se cubre', () => {
    expect(estadoPago(90, 90)).toBe('pagado')
  })
})
