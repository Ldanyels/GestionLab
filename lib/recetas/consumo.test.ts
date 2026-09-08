import { describe, it, expect } from 'vitest'
import { filasConsumoPorReceta, filasConsumoPorItems } from './data'

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

describe('filasConsumoPorItems', () => {
  const recetasCat = [
    { catalogo_trabajo_id: 'corona', producto_id: 'yeso', cantidad: 10 },
    { catalogo_trabajo_id: 'corona', producto_id: 'metal', cantidad: 2 },
    { catalogo_trabajo_id: 'ferula', producto_id: 'yeso', cantidad: 5 },
  ]

  it('multiplica cada receta por la cantidad de su línea y suma por producto', () => {
    const filas = filasConsumoPorItems(
      [
        { catalogo_trabajo_id: 'corona', cantidad: 2 }, // yeso 20, metal 4
        { catalogo_trabajo_id: 'ferula', cantidad: 1 }, // yeso 5
      ],
      recetasCat,
      ctx,
    )
    const yeso = filas.find((f) => f.producto_id === 'yeso')!
    const metal = filas.find((f) => f.producto_id === 'metal')!
    expect(yeso.cantidad).toBe(-25)
    expect(metal.cantidad).toBe(-4)
    expect(filas).toHaveLength(2)
  })

  it('línea sin receta no genera salidas', () => {
    const filas = filasConsumoPorItems(
      [{ catalogo_trabajo_id: 'sin-receta', cantidad: 3 }],
      recetasCat,
      ctx,
    )
    expect(filas).toHaveLength(0)
  })
})
