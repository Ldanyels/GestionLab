import { describe, it, expect, vi, afterEach } from 'vitest'
import { intentar, intentarSinEstado } from './acciones'
import { configurarDestino, type EntradaDeRegistro } from './registro'

afterEach(() => {
  configurarDestino(null)
  vi.restoreAllMocks()
})

function capturarRegistro(): EntradaDeRegistro[] {
  const entradas: EntradaDeRegistro[] = []
  configurarDestino((e) => entradas.push(e))
  return entradas
}

const REDIRECCION = Object.assign(new Error('NEXT_REDIRECT'), {
  digest: 'NEXT_REDIRECT;push;/trabajos;307;',
})

describe('intentar', () => {
  it('devuelve el valor cuando la operación funciona', async () => {
    const r = await intentar('x', 'respaldo', async () => 'id-123')
    expect(r).toEqual({ ok: true, valor: 'id-123' })
  })

  it('devuelve el estado del formulario con el mensaje traducido cuando falla', async () => {
    capturarRegistro()
    const r = await intentar('x', 'No se pudo guardar', async () => {
      throw { code: '23505', message: 'duplicate' }
    })
    expect(r).toEqual({ ok: false, estado: { error: 'Ya existe un registro con esos datos.' } })
  })

  it('usa el respaldo cuando el error no se reconoce', async () => {
    capturarRegistro()
    const r = await intentar('x', 'No se pudo guardar el trabajo', async () => {
      throw new Error('vaya')
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.estado.error).toBe('No se pudo guardar el trabajo')
  })

  it('registra el error con el nombre de la acción', async () => {
    const entradas = capturarRegistro()
    await intentar('crearTrabajoAction', 'respaldo', async () => {
      throw new Error('vaya')
    })
    expect(entradas).toHaveLength(1)
    expect(entradas[0]?.donde).toBe('crearTrabajoAction')
  })

  it('relanza el redirect() de Next en vez de tragárselo', async () => {
    const entradas = capturarRegistro()
    await expect(
      intentar('x', 'respaldo', async () => {
        throw REDIRECCION
      }),
    ).rejects.toBe(REDIRECCION)
    expect(entradas).toHaveLength(0)
  })

  it('no registra nada cuando la operación funciona', async () => {
    const entradas = capturarRegistro()
    await intentar('x', 'respaldo', async () => 1)
    expect(entradas).toHaveLength(0)
  })

  it('permite operaciones que devuelven void', async () => {
    const r = await intentar('x', 'respaldo', async () => {})
    expect(r.ok).toBe(true)
  })
})

describe('intentarSinEstado', () => {
  it('no lanza cuando la operación funciona', async () => {
    await expect(intentarSinEstado('x', 'respaldo', async () => {})).resolves.toBeUndefined()
  })

  it('registra y relanza el error original para que lo tome el límite de error', async () => {
    const entradas = capturarRegistro()
    const fallo = new Error('violates foreign key constraint')
    await expect(intentarSinEstado('eliminarDoctorAction', 'respaldo', async () => {
      throw fallo
    })).rejects.toBe(fallo)
    expect(entradas).toHaveLength(1)
    expect(entradas[0]?.donde).toBe('eliminarDoctorAction')
  })

  it('relanza el redirect() de Next sin registrarlo', async () => {
    const entradas = capturarRegistro()
    await expect(
      intentarSinEstado('x', 'respaldo', async () => {
        throw REDIRECCION
      }),
    ).rejects.toBe(REDIRECCION)
    expect(entradas).toHaveLength(0)
  })
})
