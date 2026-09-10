import { describe, it, expect } from 'vitest'
import { huellaDeError, normalizarMensaje } from './huella'

describe('normalizarMensaje', () => {
  /*
    Sin normalizar, el mismo fallo sobre dos trabajos distintos se vería como
    dos problemas: el mensaje trae el identificador de la fila. Agrupar es lo
    que convierte 200 errores en «un problema que pasó 200 veces».
  */
  it('quita los identificadores', () => {
    expect(
      normalizarMensaje('no se encontró el trabajo 1156412c-a406-4dbf-8f61-3b9f5d321fda'),
    ).toBe('no se encontró el trabajo ‹id›')
  })

  it('quita los números', () => {
    expect(normalizarMensaje('el monto 350.50 excede el límite de 1000')).toBe(
      'el monto ‹n› excede el límite de ‹n›',
    )
  })

  it('quita las fechas', () => {
    expect(normalizarMensaje('sin cuotas desde 2026-09-01')).toBe('sin cuotas desde ‹fecha›')
  })

  /*
    Esta es la importante para la Ley 29733: los mensajes de PostgreSQL traen
    los valores que causaron el fallo, y en este sistema uno de esos valores
    puede ser el nombre de un paciente. El registro de errores no puede
    convertirse en el sitio por donde se filtran datos de salud.
  */
  it('quita los valores entre paréntesis que trae Postgres', () => {
    expect(
      normalizarMensaje('duplicate key value violates unique constraint (paciente)=(Juan Díaz)'),
    ).toBe('duplicate key value violates unique constraint (paciente)=(···)')
  })

  it('recorta los mensajes larguísimos', () => {
    const largo = 'x'.repeat(600)
    expect(normalizarMensaje(largo).length).toBeLessThanOrEqual(300)
  })

  it('normaliza espacios y saltos de línea', () => {
    expect(normalizarMensaje('fallo   en\n  la consulta')).toBe('fallo en la consulta')
  })
})

describe('huellaDeError', () => {
  /*
    Los identificadores de este sistema son UUID, y son la diferencia habitual
    entre dos ocurrencias del mismo fallo. Si estas dos no dieran la misma
    huella, cada trabajo afectado aparecería como un problema aparte.
  */
  it('el mismo error en el mismo sitio da la misma huella', () => {
    const a = huellaDeError(
      'crearTrabajoAction',
      'no se pudo guardar el trabajo 1156412c-a406-4dbf-8f61-3b9f5d321fda',
    )
    const b = huellaDeError(
      'crearTrabajoAction',
      'no se pudo guardar el trabajo 9f3ab0d1-77c2-4e5b-9a10-2c6d4e8f0b31',
    )
    expect(a).toBe(b)
  })

  it('el mismo error en otro sitio da otra huella', () => {
    const a = huellaDeError('crearTrabajoAction', 'fallo')
    const b = huellaDeError('editarTrabajoAction', 'fallo')
    expect(a).not.toBe(b)
  })

  it('errores distintos en el mismo sitio dan huellas distintas', () => {
    const a = huellaDeError('accion', 'permiso denegado')
    const b = huellaDeError('accion', 'tiempo de espera agotado')
    expect(a).not.toBe(b)
  })

  it('es corta y estable, para usarla como clave', () => {
    const h = huellaDeError('accion', 'fallo')
    expect(h).toMatch(/^[0-9a-f]{16}$/)
    expect(huellaDeError('accion', 'fallo')).toBe(h)
  })
})
