import { describe, it, expect } from 'vitest'
import { consultaDePeriodo, resolverPeriodo, resolverPeriodoFinanzas } from './periodo'

const HOY = '2026-10-07'

describe('resolverPeriodoFinanzas', () => {
  it('acepta los que existen', () => {
    expect(resolverPeriodoFinanzas('mes_anterior')).toBe('mes_anterior')
    expect(resolverPeriodoFinanzas('rango')).toBe('rango')
  })

  it('lo desconocido cae en el mes en curso', () => {
    expect(resolverPeriodoFinanzas('el-año-pasado')).toBe('mes')
    expect(resolverPeriodoFinanzas(undefined)).toBe('mes')
  })
})

describe('resolverPeriodo', () => {
  it('sin parámetros, el mes en curso', () => {
    expect(resolverPeriodo({}, HOY)).toEqual({
      periodo: 'mes',
      desde: '2026-10-01',
      hasta: '2026-10-31',
      etiqueta: 'octubre 2026',
    })
  })

  it('el mes anterior', () => {
    expect(resolverPeriodo({ periodo: 'mes_anterior' }, HOY)).toEqual({
      periodo: 'mes_anterior',
      desde: '2026-09-01',
      hasta: '2026-09-30',
      etiqueta: 'setiembre 2026',
    })
  })

  it('un rango a medida', () => {
    expect(resolverPeriodo({ periodo: 'rango', desde: '2026-08-10', hasta: '2026-09-05' }, HOY))
      .toEqual({
        periodo: 'rango',
        desde: '2026-08-10',
        hasta: '2026-09-05',
        etiqueta: '10/08/2026 – 05/09/2026',
      })
  })

  /* Un enlace guardado en favoritos trae las fechas sin el periodo. */
  it('unas fechas sueltas ya son un rango', () => {
    const r = resolverPeriodo({ desde: '2026-08-01', hasta: '2026-08-31' }, HOY)
    expect(r.periodo).toBe('rango')
    expect(r.desde).toBe('2026-08-01')
  })

  describe('rangos que no sirven', () => {
    /*
      Una pantalla de dinero en blanco no dice que el filtro esté mal: se lee
      como que no hubo movimientos. Mejor caer al mes en curso, que siempre
      significa algo.
    */
    it('un rango a medias vuelve al mes', () => {
      const r = resolverPeriodo({ periodo: 'rango', desde: '2026-08-01' }, HOY)
      expect(r.periodo).toBe('mes')
      expect(r.desde).toBe('2026-10-01')
    })

    it('un rango al revés vuelve al mes', () => {
      const r = resolverPeriodo({ periodo: 'rango', desde: '2026-09-30', hasta: '2026-09-01' }, HOY)
      expect(r.periodo).toBe('mes')
    })

    it('un rango de un solo día es válido', () => {
      const r = resolverPeriodo({ periodo: 'rango', desde: '2026-09-15', hasta: '2026-09-15' }, HOY)
      expect(r).toMatchObject({ periodo: 'rango', desde: '2026-09-15', hasta: '2026-09-15' })
    })
  })

  describe('lo que llega de la URL no se usa sin validar', () => {
    /*
      De aquí las fechas pasan a construir filtros que viajan a la base como
      texto. Un valor con paréntesis o comas se cuela dentro de la expresión y
      la altera; está probado que PostgREST acepta la consulta manipulada. Lo
      que no sea `YYYY-MM-DD` no llega nunca a la consulta.
    */
    it('una fecha con sintaxis de filtro se descarta', () => {
      const r = resolverPeriodo(
        { periodo: 'rango', desde: '2026-09-01,or(id.gt.0)', hasta: '2026-09-30' },
        HOY,
      )
      expect(r.periodo).toBe('mes')
      expect(r.desde).toBe('2026-10-01')
    })

    it('una fecha inventada —31 de setiembre— se descarta', () => {
      const r = resolverPeriodo({ periodo: 'rango', desde: '2026-09-31', hasta: '2026-10-01' }, HOY)
      expect(r.periodo).toBe('mes')
    })

    it('un periodo inventado no abre un rango sin límites', () => {
      const r = resolverPeriodo({ periodo: 'todo' }, HOY)
      expect(r).toMatchObject({ periodo: 'mes', desde: '2026-10-01', hasta: '2026-10-31' })
    })
  })

  describe('cambio de año', () => {
    it('en enero, el mes anterior es diciembre', () => {
      expect(resolverPeriodo({ periodo: 'mes_anterior' }, '2027-01-04')).toMatchObject({
        desde: '2026-12-01',
        hasta: '2026-12-31',
        etiqueta: 'diciembre 2026',
      })
    })
  })
})

describe('consultaDePeriodo', () => {
  it('un mes viaja con su nombre', () => {
    expect(consultaDePeriodo(resolverPeriodo({ periodo: 'mes_anterior' }, HOY))).toBe(
      '?periodo=mes_anterior',
    )
  })

  /* El rango necesita sus dos fechas: el nombre solo no lo reconstruye. */
  it('un rango viaja con sus fechas', () => {
    const p = resolverPeriodo({ periodo: 'rango', desde: '2026-08-01', hasta: '2026-08-31' }, HOY)
    expect(consultaDePeriodo(p)).toBe('?periodo=rango&desde=2026-08-01&hasta=2026-08-31')
  })

  /*
    Ida y vuelta: lo que se construye tiene que volver a resolverse igual, o el
    periodo se pierde al saltar de pantalla, que es justo lo que se vino a
    arreglar.
  */
  it('lo que produce se vuelve a entender', () => {
    for (const sp of [
      { periodo: 'mes' },
      { periodo: 'mes_anterior' },
      { periodo: 'rango', desde: '2026-07-03', hasta: '2026-09-28' },
    ]) {
      const p = resolverPeriodo(sp, HOY)
      const params = Object.fromEntries(new URLSearchParams(consultaDePeriodo(p)))
      expect(resolverPeriodo(params, HOY)).toEqual(p)
    }
  })
})
