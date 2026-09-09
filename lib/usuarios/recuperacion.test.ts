import { describe, it, expect } from 'vitest'
import { claveNuevaSchema, correoSchema } from './recuperacion'

describe('correoSchema', () => {
  it('acepta un correo válido y le quita los espacios', () => {
    expect(correoSchema.parse({ email: '  ana@lab.pe ' }).email).toBe('ana@lab.pe')
  })

  it('rechaza un correo inválido con mensaje en español', () => {
    const r = correoSchema.safeParse({ email: 'no-es-correo' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('Correo inválido')
  })

  it('rechaza el correo vacío', () => {
    expect(correoSchema.safeParse({ email: '' }).success).toBe(false)
  })
})

describe('claveNuevaSchema', () => {
  it('acepta dos contraseñas iguales de 6 o más caracteres', () => {
    expect(
      claveNuevaSchema.safeParse({ password: 'abc123', confirmacion: 'abc123' }).success,
    ).toBe(true)
  })

  it('exige al menos 6 caracteres, igual que al crear el usuario', () => {
    const r = claveNuevaSchema.safeParse({ password: 'abc12', confirmacion: 'abc12' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.issues[0]?.message).toBe('La contraseña debe tener al menos 6 caracteres')
  })

  it('rechaza cuando la confirmación no coincide', () => {
    const r = claveNuevaSchema.safeParse({ password: 'abc123', confirmacion: 'abc124' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('Las contraseñas no coinciden')
  })

  // La contraseña no se recorta: un espacio al principio o al final es un
  // carácter válido, y recortarlo dejaría al usuario sin poder entrar con lo
  // que él cree que escribió.
  it('no recorta la contraseña: los espacios son caracteres válidos', () => {
    const clave = '  hola  '
    const r = claveNuevaSchema.safeParse({ password: clave, confirmacion: clave })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.password).toBe(clave)
  })
})
