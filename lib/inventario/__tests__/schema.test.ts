import { describe, it, expect } from 'vitest'
import { productoSchema, deltaMovimiento } from '@/lib/inventario/schema'

describe('productoSchema', () => {
  it('acepta un producto válido', () => {
    const r = productoSchema.parse({
      nombre: 'Acrílico rosado',
      unidad: 'g',
      stock_minimo: '100',
      costo_unitario: '0.5',
      stock_inicial: '500',
    })
    expect(r.nombre).toBe('Acrílico rosado')
    expect(r.stock_minimo).toBe(100)
    expect(r.stock_inicial).toBe(500)
  })
  it('rechaza nombre vacío', () => {
    expect(productoSchema.safeParse({ nombre: '' }).success).toBe(false)
  })
})

describe('deltaMovimiento', () => {
  const base = { cantidad: 10, ajuste_resta: false, motivo: null, fecha: null }
  it('ingreso suma', () => {
    expect(deltaMovimiento({ ...base, tipo: 'ingreso' })).toBe(10)
  })
  it('salida y merma restan', () => {
    expect(deltaMovimiento({ ...base, tipo: 'salida' })).toBe(-10)
    expect(deltaMovimiento({ ...base, tipo: 'merma' })).toBe(-10)
  })
  it('ajuste respeta el signo elegido', () => {
    expect(deltaMovimiento({ ...base, tipo: 'ajuste' })).toBe(10)
    expect(deltaMovimiento({ ...base, tipo: 'ajuste', ajuste_resta: true })).toBe(-10)
  })
})
