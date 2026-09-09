import { describe, it, expect } from 'vitest'
import {
  ETIQUETA_PERIODO,
  filtrarPorFecha,
  PERIODOS,
  rangoDePeriodo,
  resolverPeriodo,
  restarDias,
} from './periodo'

const HOY = '2026-09-08'

describe('restarDias', () => {
  it('resta dentro del mismo mes', () => {
    expect(restarDias('2026-09-08', 6)).toBe('2026-09-02')
  })

  it('cruza el inicio de mes', () => {
    expect(restarDias('2026-09-08', 30)).toBe('2026-08-09')
  })

  it('cruza el inicio de año', () => {
    expect(restarDias('2026-01-03', 5)).toBe('2025-12-29')
  })

  it('respeta los años bisiestos', () => {
    expect(restarDias('2028-03-01', 1)).toBe('2028-02-29')
  })

  it('restar cero devuelve el mismo día', () => {
    expect(restarDias(HOY, 0)).toBe(HOY)
  })

  // Aritmética en UTC a propósito: usar la zona local del servidor haría que el
  // resultado cambiara según dónde corra la función.
  it('rellena mes y día con dos dígitos', () => {
    expect(restarDias('2026-10-05', 4)).toBe('2026-10-01')
  })
})

describe('resolverPeriodo', () => {
  it('acepta los periodos conocidos', () => {
    for (const p of PERIODOS) expect(resolverPeriodo(p)).toBe(p)
  })

  it('cualquier otra cosa cae en "todo"', () => {
    expect(resolverPeriodo(undefined)).toBe('todo')
    expect(resolverPeriodo('')).toBe('todo')
    expect(resolverPeriodo('ayer')).toBe('todo')
    expect(resolverPeriodo('DROP TABLE')).toBe('todo')
  })
})

describe('rangoDePeriodo', () => {
  it('"todo" no acota nada', () => {
    expect(rangoDePeriodo('todo', HOY)).toBeNull()
  })

  it('"hoy" es un solo día', () => {
    expect(rangoDePeriodo('hoy', HOY)).toEqual({ desde: HOY, hasta: HOY })
  })

  it('"7d" incluye hoy y los seis anteriores', () => {
    expect(rangoDePeriodo('7d', HOY)).toEqual({ desde: '2026-09-02', hasta: HOY })
  })

  it('"30d" incluye hoy y los veintinueve anteriores', () => {
    expect(rangoDePeriodo('30d', HOY)).toEqual({ desde: '2026-08-10', hasta: HOY })
  })

  it('"rango" usa las fechas que se le pasan', () => {
    expect(rangoDePeriodo('rango', HOY, '2026-09-01', '2026-09-05')).toEqual({
      desde: '2026-09-01',
      hasta: '2026-09-05',
    })
  })

  it('"rango" sin fechas no acota: no deja la lista vacía por accidente', () => {
    expect(rangoDePeriodo('rango', HOY)).toBeNull()
  })

  it('"rango" con solo una fecha acota por ese extremo', () => {
    expect(rangoDePeriodo('rango', HOY, '2026-09-05')).toEqual({
      desde: '2026-09-05',
      hasta: '9999-12-31',
    })
    expect(rangoDePeriodo('rango', HOY, undefined, '2026-09-05')).toEqual({
      desde: '0000-01-01',
      hasta: '2026-09-05',
    })
  })

  it('"rango" al revés se endereza en vez de devolver nada', () => {
    expect(rangoDePeriodo('rango', HOY, '2026-09-30', '2026-09-01')).toEqual({
      desde: '2026-09-01',
      hasta: '2026-09-30',
    })
  })
})

describe('filtrarPorFecha', () => {
  const lista = [
    { id: 'a', fecha_ingreso: '2026-09-08' },
    { id: 'b', fecha_ingreso: '2026-09-07' },
    { id: 'c', fecha_ingreso: '2026-08-15' },
  ]

  it('sin rango devuelve todo', () => {
    expect(filtrarPorFecha(lista, null).map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('filtra por fecha de ingreso, con los extremos incluidos', () => {
    expect(
      filtrarPorFecha(lista, { desde: '2026-09-07', hasta: '2026-09-08' }).map((t) => t.id),
    ).toEqual(['a', 'b'])
  })

  it('un solo día deja solo ese día', () => {
    expect(
      filtrarPorFecha(lista, { desde: '2026-09-07', hasta: '2026-09-07' }).map((t) => t.id),
    ).toEqual(['b'])
  })

  it('un rango sin coincidencias devuelve lista vacía', () => {
    expect(filtrarPorFecha(lista, { desde: '2020-01-01', hasta: '2020-12-31' })).toEqual([])
  })

  it('no muta la lista original', () => {
    const copia = [...lista]
    filtrarPorFecha(lista, { desde: HOY, hasta: HOY })
    expect(lista).toEqual(copia)
  })
})

describe('ETIQUETA_PERIODO', () => {
  it('tiene etiqueta para cada periodo', () => {
    for (const p of PERIODOS) expect(ETIQUETA_PERIODO[p]).toBeTruthy()
  })
})
