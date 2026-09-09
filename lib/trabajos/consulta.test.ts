import { describe, it, expect } from 'vitest'
import { enlaceTrabajos, resolverFiltrosTrabajos, tituloTrabajos } from './consulta'

describe('resolverFiltrosTrabajos', () => {
  it('sin parámetros devuelve los valores por defecto', () => {
    expect(resolverFiltrosTrabajos({})).toEqual({
      estado: undefined,
      pago: 'cualquiera',
      periodo: 'todo',
      desde: undefined,
      hasta: undefined,
      q: undefined,
    })
  })

  it('lee los cuatro filtros y la búsqueda', () => {
    expect(
      resolverFiltrosTrabajos({
        estado: 'entregado',
        pago: 'por_cobrar',
        periodo: 'rango',
        desde: '2026-09-01',
        hasta: '2026-09-05',
        q: 'corona',
      }),
    ).toEqual({
      estado: 'entregado',
      pago: 'por_cobrar',
      periodo: 'rango',
      desde: '2026-09-01',
      hasta: '2026-09-05',
      q: 'corona',
    })
  })

  it('descarta un estado inválido en vez de romper', () => {
    expect(resolverFiltrosTrabajos({ estado: 'inventado' }).estado).toBeUndefined()
    expect(resolverFiltrosTrabajos({ estado: '' }).estado).toBeUndefined()
  })

  it('descarta un pago y un periodo inválidos', () => {
    const f = resolverFiltrosTrabajos({ pago: 'parcial', periodo: 'ayer' })
    expect(f.pago).toBe('cualquiera')
    expect(f.periodo).toBe('todo')
  })

  it('ignora las fechas cuando el periodo no es de rango', () => {
    const f = resolverFiltrosTrabajos({ periodo: 'hoy', desde: '2026-09-01' })
    expect(f.desde).toBeUndefined()
    expect(f.hasta).toBeUndefined()
  })
})

describe('tituloTrabajos', () => {
  it('sin filtros es "Trabajos"', () => {
    expect(tituloTrabajos(undefined, 'cualquiera')).toBe('Trabajos')
  })

  it('solo estado usa el nombre del estado', () => {
    expect(tituloTrabajos('en_curso', 'cualquiera')).toBe('En curso')
    expect(tituloTrabajos('cerrado', 'cualquiera')).toBe('Cerrados')
    expect(tituloTrabajos('entregado', 'cualquiera')).toBe('Entregados')
  })

  it('solo pago usa el nombre del cobro', () => {
    expect(tituloTrabajos(undefined, 'por_cobrar')).toBe('Por cobrar')
    expect(tituloTrabajos(undefined, 'pagados')).toBe('Pagados')
  })

  // Este es el punto: la combinación se lee como la pidió el cliente, aunque
  // se arme con dos pastillas independientes.
  it('estado y pago juntos se leen como una sola frase', () => {
    expect(tituloTrabajos('entregado', 'por_cobrar')).toBe('Entregados por cobrar')
    expect(tituloTrabajos('entregado', 'pagados')).toBe('Entregados pagados')
    expect(tituloTrabajos('en_curso', 'por_cobrar')).toBe('En curso por cobrar')
  })
})

describe('enlaceTrabajos', () => {
  it('sin nada devuelve la ruta limpia', () => {
    expect(enlaceTrabajos({})).toBe('/trabajos')
  })

  it('conserva los demás filtros al cambiar uno', () => {
    expect(
      enlaceTrabajos({ estado: 'entregado', pago: 'por_cobrar', q: 'corona', periodo: 'hoy' }),
    ).toBe('/trabajos?estado=entregado&pago=por_cobrar&q=corona&periodo=hoy')
  })

  it('omite los valores por defecto para no ensuciar la URL', () => {
    expect(enlaceTrabajos({ pago: 'cualquiera', periodo: 'todo', q: 'x' })).toBe('/trabajos?q=x')
  })

  it('incluye las fechas solo con el periodo de rango', () => {
    expect(
      enlaceTrabajos({ periodo: 'rango', desde: '2026-09-01', hasta: '2026-09-05' }),
    ).toBe('/trabajos?periodo=rango&desde=2026-09-01&hasta=2026-09-05')
    expect(enlaceTrabajos({ periodo: 'hoy', desde: '2026-09-01' })).toBe('/trabajos?periodo=hoy')
  })

  it('escapa lo que el usuario escribió', () => {
    expect(enlaceTrabajos({ q: 'a&b=c' })).toBe('/trabajos?q=a%26b%3Dc')
  })

  it('descarta valores vacíos', () => {
    expect(enlaceTrabajos({ q: '', estado: undefined, periodo: 'todo' })).toBe('/trabajos')
  })

  it('lo que sale de resolver vuelve a entrar sin cambiar nada', () => {
    const filtros = resolverFiltrosTrabajos({
      estado: 'entregado',
      pago: 'por_cobrar',
      periodo: 'rango',
      desde: '2026-09-01',
      hasta: '2026-09-05',
      q: 'ana',
    })
    expect(resolverFiltrosTrabajos(paramsDe(enlaceTrabajos(filtros)))).toEqual(filtros)
  })
})

/** Reconstruye el objeto de searchParams a partir de una URL, para el ida y vuelta. */
function paramsDe(url: string): Record<string, string> {
  const qs = url.split('?')[1] ?? ''
  return Object.fromEntries(new URLSearchParams(qs))
}
