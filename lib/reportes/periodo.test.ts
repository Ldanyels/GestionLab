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
    expect(resolverPeriodoReporte('7d')).toBe('7d')
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
    expect(rangoDeReporte('7d', HOY, MES)).toEqual({ desde: '2026-09-04', hasta: HOY })
  })

  // Un reporte sin rango traería el historial completo del laboratorio, que no
  // es un reporte de nada. Por eso 'todo' no está entre sus periodos.
  it('no ofrece un periodo sin límites', () => {
    expect(PERIODOS_REPORTE).not.toContain('todo')
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

describe('rangoDeReporte — mes anterior', () => {
  const mes = { desde: '2026-10-01', hasta: '2026-10-31' }

  /*
    Un reporte se entrega cuando el mes ya cerró: el día 2 lo que hace falta es
    el mes pasado, no los dos días que lleva el nuevo.
  */
  it('devuelve el mes cerrado, no el que corre', () => {
    expect(rangoDeReporte('mes_anterior', '2026-10-07', mes)).toEqual({
      desde: '2026-09-01',
      hasta: '2026-09-30',
    })
  })

  it('en enero retrocede a diciembre del año anterior', () => {
    expect(rangoDeReporte('mes_anterior', '2027-01-02', mes)).toEqual({
      desde: '2026-12-01',
      hasta: '2026-12-31',
    })
  })

  it('no depende del `mes` que se le pase: lo calcula de `hoy`', () => {
    const otro = { desde: '2020-01-01', hasta: '2020-01-31' }
    expect(rangoDeReporte('mes_anterior', '2026-10-07', otro)).toEqual({
      desde: '2026-09-01',
      hasta: '2026-09-30',
    })
  })

  it('sigue estando entre los periodos que acepta la URL', () => {
    expect(resolverPeriodoReporte('mes_anterior')).toBe('mes_anterior')
    expect(ETIQUETA_PERIODO_REPORTE.mes_anterior).toBe('Mes anterior')
  })
})
