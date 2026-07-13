import { describe, it, expect } from 'vitest'
import { filasConsumoPorReceta } from '@/lib/recetas/data'

describe('filasConsumoPorReceta', () => {
  it('genera salidas negativas por cada insumo', () => {
    const filas = filasConsumoPorReceta(
      [
        { producto_id: 'p1', cantidad: 2 },
        { producto_id: 'p2', cantidad: 0.5 },
      ],
      { laboratorioId: 'lab', trabajoId: 't1' },
    )
    expect(filas).toHaveLength(2)
    expect(filas[0]).toMatchObject({
      producto_id: 'p1',
      cantidad: -2,
      tipo: 'salida',
      trabajo_id: 't1',
      laboratorio_id: 'lab',
    })
    expect(filas[1].cantidad).toBe(-0.5)
  })
  it('devuelve vacío sin receta', () => {
    expect(
      filasConsumoPorReceta([], { laboratorioId: 'lab', trabajoId: 't1' }),
    ).toEqual([])
  })
})
