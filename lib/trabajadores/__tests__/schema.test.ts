import { describe, it, expect } from 'vitest'
import {
  trabajadorSchema,
  pagoTrabajadorSchema,
  montoEstandarSchema,
} from '@/lib/trabajadores/schema'

describe('trabajadorSchema', () => {
  it('acepta nombre válido', () => {
    expect(trabajadorSchema.parse({ nombre: ' Juan ' }).nombre).toBe('Juan')
  })
  it('rechaza vacío', () => {
    expect(trabajadorSchema.safeParse({ nombre: '' }).success).toBe(false)
  })
})

describe('pagoTrabajadorSchema', () => {
  it('acepta pago con monto y normaliza opcionales', () => {
    const r = pagoTrabajadorSchema.parse({
      monto: '50',
      fecha: '',
      nota: '',
      catalogo_trabajo_id: '',
    })
    expect(r.monto).toBe(50)
    expect(r.fecha).toBeNull()
    expect(r.catalogo_trabajo_id).toBeNull()
  })
  it('rechaza monto 0', () => {
    expect(pagoTrabajadorSchema.safeParse({ monto: '0' }).success).toBe(false)
  })
})

describe('montoEstandarSchema', () => {
  it('exige tipo de trabajo y monto positivo', () => {
    expect(
      montoEstandarSchema.safeParse({ catalogo_trabajo_id: 'no-uuid', monto: '10' }).success,
    ).toBe(false)
  })
})
