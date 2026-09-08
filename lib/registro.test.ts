import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  configurarDestino,
  construirEntrada,
  redactar,
  registrarError,
  type EntradaDeRegistro,
} from './registro'

afterEach(() => {
  configurarDestino(null)
  vi.restoreAllMocks()
})

describe('redactar', () => {
  it('oculta los valores que Postgres incluye entre paréntesis', () => {
    const crudo =
      'duplicate key value violates unique constraint "x"\nDETALLE: Key (paciente_nombre)=(Juan Pérez) already exists.'
    const limpio = redactar(crudo)
    expect(limpio).not.toContain('Juan Pérez')
    expect(limpio).toContain('(paciente_nombre)=(···)')
  })

  it('conserva el nombre de la columna, que sí es útil para depurar', () => {
    expect(redactar('Key (doctor_id)=(abc-123) is not present')).toContain('(doctor_id)')
  })

  it('redacta varios valores en el mismo mensaje', () => {
    const limpio = redactar('Key (a)=(uno) y Key (b)=(dos)')
    expect(limpio).not.toContain('uno')
    expect(limpio).not.toContain('dos')
  })

  it('deja intacto un mensaje sin valores', () => {
    expect(redactar('new row violates row-level security policy')).toBe(
      'new row violates row-level security policy',
    )
  })

  it('tolera texto vacío', () => {
    expect(redactar('')).toBe('')
  })
})

describe('construirEntrada', () => {
  it('registra dónde ocurrió y con qué código', () => {
    const entrada = construirEntrada('crearTrabajoAction', { code: '23505', message: 'x' })
    expect(entrada.donde).toBe('crearTrabajoAction')
    expect(entrada.codigo).toBe('23505')
    expect(entrada.severidad).toBe('error')
  })

  it('fecha la entrada en formato ISO', () => {
    expect(construirEntrada('x', new Error('y')).momento).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    )
  })

  it('redacta el mensaje antes de guardarlo', () => {
    const e = new Error('Key (paciente_nombre)=(María Gómez) already exists')
    expect(construirEntrada('x', e).mensaje).not.toContain('María Gómez')
  })

  it('incluye el laboratorio y el usuario cuando se le pasan', () => {
    const entrada = construirEntrada('x', new Error('y'), {
      laboratorioId: 'lab-1',
      usuarioId: 'usr-1',
    })
    expect(entrada.laboratorioId).toBe('lab-1')
    expect(entrada.usuarioId).toBe('usr-1')
  })

  it('deja el contexto en null cuando no se le pasa', () => {
    const entrada = construirEntrada('x', new Error('y'))
    expect(entrada.laboratorioId).toBeNull()
    expect(entrada.usuarioId).toBeNull()
  })

  it('nunca guarda el nombre del paciente aunque venga en el texto libre', () => {
    const e = new Error('fallo al guardar el trabajo de (paciente)=(Ana Torres)')
    expect(JSON.stringify(construirEntrada('x', e))).not.toContain('Ana Torres')
  })
})

describe('registrarError', () => {
  it('devuelve el mensaje legible para el usuario', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(registrarError('x', { code: '23505' }, 'respaldo')).toBe(
      'Ya existe un registro con esos datos.',
    )
  })

  it('usa el respaldo cuando el error no se reconoce', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(registrarError('x', new Error('vaya'), 'No se pudo guardar')).toBe('No se pudo guardar')
  })

  it('escribe en la consola cuando no hay destino configurado', () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {})
    registrarError('crearTrabajoAction', new Error('vaya'), 'respaldo')
    expect(espia).toHaveBeenCalledOnce()
    expect(String(espia.mock.calls[0]?.[0])).toContain('crearTrabajoAction')
  })

  it('entrega la entrada al destino configurado', () => {
    const recibidas: EntradaDeRegistro[] = []
    configurarDestino((e) => recibidas.push(e))
    registrarError('editarTrabajoAction', { code: '42501', message: 'nope' }, 'respaldo')
    expect(recibidas).toHaveLength(1)
    expect(recibidas[0]?.donde).toBe('editarTrabajoAction')
    expect(recibidas[0]?.codigo).toBe('42501')
  })

  it('no escribe en consola cuando hay destino configurado', () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {})
    configurarDestino(() => {})
    registrarError('x', new Error('y'), 'respaldo')
    expect(espia).not.toHaveBeenCalled()
  })

  it('un destino que falla no tumba la petición', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    configurarDestino(() => {
      throw new Error('el destino se cayó')
    })
    expect(registrarError('x', new Error('y'), 'respaldo')).toBe('respaldo')
  })

  it('relanza el control de flujo de Next sin registrarlo', () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {})
    const e = Object.assign(new Error('NEXT_REDIRECT'), {
      digest: 'NEXT_REDIRECT;push;/trabajos;307;',
    })
    expect(() => registrarError('x', e, 'respaldo')).toThrow(e)
    expect(espia).not.toHaveBeenCalled()
  })
})
