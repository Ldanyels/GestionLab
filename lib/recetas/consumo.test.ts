import { describe, it, expect } from 'vitest'
import { filasConsumoPorReceta } from './data'

const ctx = { laboratorioId: 'lab-1', trabajoId: 'tr-1' }
const recetas = [
  { producto_id: 'p1', cantidad: 10 },
  { producto_id: 'p2', cantidad: 2.5 },
]

describe('filasConsumoPorReceta', () => {
  it('genera salidas negativas por cada insumo', () => {
    const filas = filasConsumoPorReceta(recetas, ctx)
    expect(filas).toHaveLength(2)
    expect(filas[0]).toMatchObject({ producto_id: 'p1', tipo: 'salida', cantidad: -10 })
    expect(filas[1].cantidad).toBe(-2.5)
  })

  it('multiplica el consumo por la cantidad de piezas del trabajo', () => {
    const filas = filasConsumoPorReceta(recetas, { ...ctx, multiplicador: 3 })
    expect(filas[0].cantidad).toBe(-30)
    expect(filas[1].cantidad).toBe(-7.5)
    expect(filas[0].motivo).toBe('Consumo por trabajo (×3)')
  })

  it('multiplicador inválido o ausente equivale a 1', () => {
    expect(filasConsumoPorReceta(recetas, { ...ctx, multiplicador: 0 })[0].cantidad).toBe(-10)
    expect(filasConsumoPorReceta(recetas, ctx)[0].motivo).toBe('Consumo por trabajo')
  })
})
