import { describe, it, expect } from 'vitest'
import {
  esControlDeFlujoDeNext,
  interpretarError,
  mensajeDeError,
} from './errores'

const RESPALDO = 'No se pudo guardar'

describe('esControlDeFlujoDeNext', () => {
  it('reconoce la excepción que lanza redirect()', () => {
    const e = Object.assign(new Error('NEXT_REDIRECT'), {
      digest: 'NEXT_REDIRECT;replace;/trabajos/abc;307;',
    })
    expect(esControlDeFlujoDeNext(e)).toBe(true)
  })

  it('reconoce la excepción que lanza notFound()', () => {
    const e = Object.assign(new Error('NEXT_NOT_FOUND'), { digest: 'NEXT_NOT_FOUND' })
    expect(esControlDeFlujoDeNext(e)).toBe(true)
  })

  it('reconoce el fallback de errores HTTP de Next', () => {
    const e = Object.assign(new Error('x'), { digest: 'NEXT_HTTP_ERROR_FALLBACK;404' })
    expect(esControlDeFlujoDeNext(e)).toBe(true)
  })

  it('un error de base de datos no es control de flujo', () => {
    expect(esControlDeFlujoDeNext(new Error('duplicate key value'))).toBe(false)
  })

  it('tolera valores que no son errores', () => {
    expect(esControlDeFlujoDeNext(null)).toBe(false)
    expect(esControlDeFlujoDeNext('NEXT_REDIRECT')).toBe(false)
    expect(esControlDeFlujoDeNext({ digest: 42 })).toBe(false)
  })
})

describe('interpretarError — por código', () => {
  const casos: Array<[string, string]> = [
    ['23505', 'Ya existe un registro con esos datos.'],
    ['23503', 'No se puede completar: hay otros registros que dependen de este.'],
    ['23502', 'Falta completar un campo obligatorio.'],
    ['23514', 'Alguno de los datos no cumple las reglas del sistema.'],
    ['42501', 'No tienes permiso para hacer esto.'],
    ['57014', 'La operación tardó demasiado. Vuelve a intentarlo.'],
    ['PGRST116', 'No se encontró el registro.'],
  ]

  for (const [codigo, mensaje] of casos) {
    it(`traduce ${codigo}`, () => {
      expect(interpretarError({ code: codigo, message: 'detalle crudo' }, RESPALDO)).toEqual({
        mensaje,
        codigo,
      })
    })
  }
})

describe('interpretarError — por texto del mensaje', () => {
  it('detecta violación de unicidad', () => {
    const e = new Error('duplicate key value violates unique constraint "producto_nombre_key"')
    expect(interpretarError(e, RESPALDO).mensaje).toBe('Ya existe un registro con esos datos.')
  })

  it('detecta violación de llave foránea', () => {
    const e = new Error('update or delete on table "consultorio" violates foreign key constraint')
    expect(interpretarError(e, RESPALDO).mensaje).toBe(
      'No se puede completar: hay otros registros que dependen de este.',
    )
  })

  it('detecta bloqueo por seguridad a nivel de fila', () => {
    const e = new Error('new row violates row-level security policy for table "trabajo"')
    expect(interpretarError(e, RESPALDO).mensaje).toBe('No tienes permiso para hacer esto.')
  })

  it('detecta columna inexistente como error del sistema', () => {
    const e = new Error('column perfil.permisos does not exist')
    expect(interpretarError(e, RESPALDO).mensaje).toBe(
      'El sistema está desactualizado. Avisa al administrador.',
    )
  })

  it('detecta fallos de red', () => {
    for (const texto of ['fetch failed', 'NetworkError when attempting to fetch', 'ECONNREFUSED']) {
      expect(interpretarError(new Error(texto), RESPALDO).mensaje).toBe(
        'No se pudo conectar con el servidor. Revisa tu conexión y vuelve a intentarlo.',
      )
    }
  })

  it('es insensible a mayúsculas', () => {
    const e = new Error('DUPLICATE KEY VALUE VIOLATES UNIQUE CONSTRAINT')
    expect(interpretarError(e, RESPALDO).mensaje).toBe('Ya existe un registro con esos datos.')
  })
})

describe('interpretarError — casos sin identificar', () => {
  it('usa el respaldo cuando no reconoce el error', () => {
    expect(interpretarError(new Error('algo rarísimo pasó'), RESPALDO)).toEqual({
      mensaje: RESPALDO,
      codigo: null,
    })
  })

  it('nunca filtra el mensaje crudo al usuario', () => {
    const crudo = 'ERROR: relation "secreto_interno" does not exist at character 15'
    expect(interpretarError(new Error(crudo), RESPALDO).mensaje).not.toContain('secreto_interno')
  })

  it('tolera null, undefined y strings', () => {
    expect(interpretarError(null, RESPALDO).mensaje).toBe(RESPALDO)
    expect(interpretarError(undefined, RESPALDO).mensaje).toBe(RESPALDO)
    expect(interpretarError('texto suelto', RESPALDO).mensaje).toBe(RESPALDO)
  })

  it('el código gana sobre el texto cuando ambos están presentes', () => {
    const e = { code: '42501', message: 'duplicate key value violates unique constraint' }
    expect(interpretarError(e, RESPALDO).mensaje).toBe('No tienes permiso para hacer esto.')
  })
})

describe('mensajeDeError', () => {
  it('devuelve solo el texto', () => {
    expect(mensajeDeError({ code: '23505' }, RESPALDO)).toBe(
      'Ya existe un registro con esos datos.',
    )
  })

  it('relanza el control de flujo de Next en vez de traducirlo', () => {
    const e = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;push;/hoy;307;' })
    expect(() => mensajeDeError(e, RESPALDO)).toThrow(e)
  })
})
