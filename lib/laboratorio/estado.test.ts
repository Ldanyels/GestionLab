import { describe, it, expect } from 'vitest'
import { estaSuspendido, puedeUsarElSistema } from './estado'

describe('estaSuspendido', () => {
  it('es verdadero solo cuando el estado dice suspendido', () => {
    expect(estaSuspendido({ estado: 'suspendido' })).toBe(true)
  })

  it('es falso con un laboratorio activo', () => {
    expect(estaSuspendido({ estado: 'activo' })).toBe(false)
  })

  // Decisión deliberada: ante la duda, dejar entrar.
  //
  // En este proyecto ya ocurrió que un fallo de lectura (la columna
  // `perfil.permisos` de una migración pendiente) dejó a todos fuera del
  // sistema con un mensaje engañoso. Bloquear cuando no sabemos repetiría ese
  // error, y el costo de los dos fallos no es simétrico: dejar entrar de más a
  // un laboratorio moroso cuesta unos días de servicio; dejar fuera a uno que
  // paga y está trabajando le detiene el taller.
  it('es falso cuando no se pudo leer el laboratorio', () => {
    expect(estaSuspendido(null)).toBe(false)
    expect(estaSuspendido(undefined)).toBe(false)
  })

  it('es falso cuando el estado viene vacío o desconocido', () => {
    expect(estaSuspendido({ estado: null })).toBe(false)
    expect(estaSuspendido({ estado: '' })).toBe(false)
    expect(estaSuspendido({ estado: 'lo-que-sea' })).toBe(false)
  })

  it('no se confunde con mayúsculas ni espacios', () => {
    expect(estaSuspendido({ estado: ' SUSPENDIDO ' })).toBe(true)
  })
})

describe('puedeUsarElSistema', () => {
  it('es lo contrario de estar suspendido', () => {
    expect(puedeUsarElSistema({ estado: 'activo' })).toBe(true)
    expect(puedeUsarElSistema({ estado: 'suspendido' })).toBe(false)
  })

  it('permite usar el sistema cuando el laboratorio es desconocido', () => {
    expect(puedeUsarElSistema(null)).toBe(true)
  })
})
