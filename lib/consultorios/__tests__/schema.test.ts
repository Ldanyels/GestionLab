import { describe, it, expect } from 'vitest'
import { consultorioSchema, doctorSchema } from '@/lib/consultorios/schema'

describe('consultorioSchema', () => {
  it('acepta un consultorio válido y normaliza opcionales vacíos a null', () => {
    const r = consultorioSchema.parse({ nombre: '  Clínica Dental  ', contacto: '', notas: '' })
    expect(r.nombre).toBe('Clínica Dental')
    expect(r.contacto).toBeNull()
    expect(r.notas).toBeNull()
  })
  it('rechaza nombre vacío', () => {
    const r = consultorioSchema.safeParse({ nombre: '   ' })
    expect(r.success).toBe(false)
  })
})

describe('doctorSchema', () => {
  it('acepta un doctor válido', () => {
    const r = doctorSchema.parse({ nombre: 'Dra. Pérez', contacto: '999888777' })
    expect(r.nombre).toBe('Dra. Pérez')
    expect(r.contacto).toBe('999888777')
  })
  it('rechaza nombre vacío', () => {
    expect(doctorSchema.safeParse({ nombre: '' }).success).toBe(false)
  })
})
