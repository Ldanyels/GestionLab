import { describe, it, expect } from 'vitest'
import { laboratorioNuevoSchema } from './laboratorios'

const valido = {
  laboratorio: 'Dental Sur',
  adminNombre: 'Ana Torres',
  adminEmail: 'ana@dentalsur.pe',
  adminPassword: 'abc123',
}

describe('laboratorioNuevoSchema', () => {
  it('acepta los datos completos y recorta los espacios', () => {
    const r = laboratorioNuevoSchema.parse({ ...valido, laboratorio: '  Dental Sur  ' })
    expect(r.laboratorio).toBe('Dental Sur')
  })

  it('exige el nombre del laboratorio', () => {
    const r = laboratorioNuevoSchema.safeParse({ ...valido, laboratorio: '  ' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.issues[0]?.message).toBe('El nombre del laboratorio es obligatorio')
  })

  it('exige el nombre del administrador', () => {
    expect(laboratorioNuevoSchema.safeParse({ ...valido, adminNombre: '' }).success).toBe(false)
  })

  it('valida el correo', () => {
    const r = laboratorioNuevoSchema.safeParse({ ...valido, adminEmail: 'no-es-correo' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('Correo inválido')
  })

  it('exige el mismo mínimo de contraseña que el resto del sistema', () => {
    const r = laboratorioNuevoSchema.safeParse({ ...valido, adminPassword: 'abc12' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.issues[0]?.message).toBe('La contraseña debe tener al menos 6 caracteres')
  })

  it('no recorta la contraseña', () => {
    const clave = '  hola  '
    const r = laboratorioNuevoSchema.parse({ ...valido, adminPassword: clave })
    expect(r.adminPassword).toBe(clave)
  })
})
