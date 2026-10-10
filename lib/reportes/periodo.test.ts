import { describe, it, expect } from 'vitest'
import {
  ETIQUETA_PERIODO_REPORTE,
  PERIODOS_REPORTE,
  rangoDeReporte,
  resolverPeriodoReporte,
} from './periodo'

const HOY = '2026-09-10'
const MES = { desde: '2026-09-01', hasta: '2026-09-30' }

describe('resolverPeriodoReporte', () => {
  // El mes es el periodo por defecto porque un reporte se entrega por mes;
  // en trabajos, en cambio, el valor por omisión es «todo».
  it('sin parámetro devuelve el mes', () => {
    expect(resolverPeriodoReporte(undefined)).toBe('mes')
  })

  it('acepta los periodos conocidos', () => {
    expect(resolverPeriodoReporte('hoy')).toBe('hoy')
    expect(resolverPeriodoReporte('rango')).toBe('rango')
  })

  it('cualquier cosa desconocida cae en el mes', () => {
    expect(resolverPeriodoReporte('el-mes-que-viene')).toBe('mes')
  })
})

describe('rangoDeReporte', () => {
  it('el mes usa el rango del mes en curso', () => {
    expect(rangoDeReporte('mes', HOY, MES)).toEqual(MES)
  })

  it('reutiliza los periodos de trabajos', () => {
    expect(rangoDeReporte('hoy', HOY, MES)).toEqual({ desde: HOY, hasta: HOY })
  })

  it('los que se quitaron caen en el mes, no rompen el enlace', () => {
    for (const viejo of ['mes_anterior', '7d', '30d']) {
      expect(resolverPeriodoReporte(viejo)).toBe('mes')
    }
  })

  it('el rango a medida respeta las fechas dadas', () => {
    expect(rangoDeReporte('rango', HOY, MES, '2026-08-01', '2026-08-15')).toEqual({
      desde: '2026-08-01',
      hasta: '2026-08-15',
    })
  })

  // Si el rango llega vacío, caer al mes evita traer todo el historial.
  it('el rango sin fechas cae al mes', () => {
    expect(rangoDeReporte('rango', HOY, MES)).toEqual(MES)
  })
})

describe('ETIQUETA_PERIODO_REPORTE', () => {
  it('tiene etiqueta para cada periodo', () => {
    for (const p of PERIODOS_REPORTE) expect(ETIQUETA_PERIODO_REPORTE[p]).toBeTruthy()
  })
})

describe('rangoDeReporte — todo', () => {
  /*
    Cobrar no es una pregunta mensual. De 78 trabajos entregados con deuda,
    «este mes» enseñaba 37 y dejaba fuera S/7.420 que se siguen debiendo.
  */
  it('no pone límites de fecha', () => {
    expect(rangoDeReporte('todo', HOY, MES)).toEqual({ desde: '', hasta: '' })
  })

  /*
    Vacío y no `undefined`: las consultas comprueban `if (f.desde)` antes de
    acotar, así que la cadena vacía ya significa «sin límite» en todas ellas
    sin un caso especial por consulta.
  */
  it('devuelve cadenas vacías, que es lo que las consultas entienden', () => {
    const r = rangoDeReporte('todo', HOY, MES)
    expect(r.desde).toBe('')
    expect(Boolean(r.desde)).toBe(false)
  })

  it('está primero entre los atajos', () => {
    expect(PERIODOS_REPORTE).toEqual(['todo', 'rango', 'hoy', 'mes'])
  })

  it('se acepta desde la URL', () => {
    expect(resolverPeriodoReporte('todo')).toBe('todo')
  })
})
