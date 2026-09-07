import { describe, it, expect } from 'vitest'
import { precioEfectivo, precioTotalTrabajo } from './precio'

describe('precioEfectivo', () => {
  it('suma base + variable × cantidad variable', () => {
    expect(
      precioEfectivo({ precio_base: 120, variable_precio_unitario: 20 }, 3),
    ).toBe(180)
  })

  it('sin componente variable devuelve el precio base', () => {
    expect(
      precioEfectivo({ precio_base: 100, variable_precio_unitario: null }, 5),
    ).toBe(100)
  })
})

describe('precioTotalTrabajo', () => {
  const simple = { precio_base: 100, variable_precio_unitario: null }

  it('multiplica el precio del tipo por la cantidad de piezas', () => {
    expect(precioTotalTrabajo(simple, 3, 0)).toBe(300)
  })

  it('cantidad 1 equivale al precio efectivo', () => {
    expect(precioTotalTrabajo(simple, 1, 0)).toBe(100)
  })

  it('trata cantidades inválidas (0, negativas, NaN) como 1', () => {
    expect(precioTotalTrabajo(simple, 0, 0)).toBe(100)
    expect(precioTotalTrabajo(simple, -2, 0)).toBe(100)
    expect(precioTotalTrabajo(simple, Number.NaN, 0)).toBe(100)
  })

  it('el componente variable se aplica por pieza', () => {
    const telescopica = { precio_base: 120, variable_precio_unitario: 20 }
    // 2 piezas, cada una con 3 cofias: 2 × (120 + 20×3) = 360
    expect(precioTotalTrabajo(telescopica, 2, 3)).toBe(360)
  })

  it('redondea a 2 decimales', () => {
    const item = { precio_base: 33.335, variable_precio_unitario: null }
    expect(precioTotalTrabajo(item, 3, 0)).toBe(100.01)
  })
})
