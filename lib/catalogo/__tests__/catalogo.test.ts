import { describe, it, expect } from 'vitest'
import { catalogoSchema } from '@/lib/catalogo/schema'
import { precioEfectivo } from '@/lib/catalogo/precio'

describe('catalogoSchema', () => {
  it('acepta un trabajo simple sin componente variable', () => {
    const r = catalogoSchema.parse({
      categoria: 'Prótesis Fija',
      nombre: 'Corona porcelana',
      precio_base: '90',
      variable_etiqueta: '',
      variable_precio_unitario: '',
    })
    expect(r.precio_base).toBe(90)
    expect(r.variable_etiqueta).toBeNull()
    expect(r.variable_precio_unitario).toBeNull()
  })

  it('acepta componente variable completo', () => {
    const r = catalogoSchema.parse({
      categoria: 'Prótesis Total',
      nombre: 'Telescópicas',
      precio_base: '120',
      variable_etiqueta: 'cofia',
      variable_precio_unitario: '20',
    })
    expect(r.variable_etiqueta).toBe('cofia')
    expect(r.variable_precio_unitario).toBe(20)
  })

  it('rechaza componente variable incompleto (etiqueta sin precio)', () => {
    const r = catalogoSchema.safeParse({
      categoria: 'X',
      nombre: 'Y',
      precio_base: '10',
      variable_etiqueta: 'cofia',
      variable_precio_unitario: '',
    })
    expect(r.success).toBe(false)
  })
})

describe('precioEfectivo', () => {
  it('devuelve el precio base cuando no hay componente variable', () => {
    expect(precioEfectivo({ precio_base: 90, variable_precio_unitario: null })).toBe(90)
  })
  it('suma el componente variable por cantidad', () => {
    expect(
      precioEfectivo({ precio_base: 120, variable_precio_unitario: 20 }, 3),
    ).toBe(180)
  })
  it('ignora cantidades negativas', () => {
    expect(
      precioEfectivo({ precio_base: 120, variable_precio_unitario: 20 }, -5),
    ).toBe(120)
  })
})
