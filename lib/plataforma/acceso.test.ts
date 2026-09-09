import { describe, it, expect } from 'vitest'
import { esSuperAdmin } from './acceso'

const LISTA = 'jefe@skardiam.com, otro@skardiam.com'

describe('esSuperAdmin', () => {
  it('reconoce un correo de la lista', () => {
    expect(esSuperAdmin('jefe@skardiam.com', LISTA)).toBe(true)
    expect(esSuperAdmin('otro@skardiam.com', LISTA)).toBe(true)
  })

  it('rechaza a quien no está', () => {
    expect(esSuperAdmin('ajeno@ejemplo.com', LISTA)).toBe(false)
  })

  it('no distingue mayúsculas ni espacios sobrantes', () => {
    expect(esSuperAdmin('  JEFE@Skardiam.COM  ', LISTA)).toBe(true)
  })

  // Lo más importante de esta función: la ausencia de configuración no puede
  // interpretarse como "todos".
  it('sin lista configurada nadie es super-administrador', () => {
    expect(esSuperAdmin('jefe@skardiam.com', undefined)).toBe(false)
    expect(esSuperAdmin('jefe@skardiam.com', '')).toBe(false)
    expect(esSuperAdmin('jefe@skardiam.com', '   ')).toBe(false)
  })

  it('sin correo tampoco', () => {
    expect(esSuperAdmin(null, LISTA)).toBe(false)
    expect(esSuperAdmin(undefined, LISTA)).toBe(false)
    expect(esSuperAdmin('', LISTA)).toBe(false)
  })

  it('una lista con entradas vacías no abre la puerta', () => {
    expect(esSuperAdmin('', ',, ,')).toBe(false)
    expect(esSuperAdmin('x@y.com', ',,')).toBe(false)
  })

  it('acepta un solo correo sin comas', () => {
    expect(esSuperAdmin('solo@skardiam.com', 'solo@skardiam.com')).toBe(true)
  })

  it('no acepta coincidencias parciales', () => {
    expect(esSuperAdmin('jefe@skardiam.com.mx', LISTA)).toBe(false)
    expect(esSuperAdmin('nojefe@skardiam.com', LISTA)).toBe(false)
  })
})
