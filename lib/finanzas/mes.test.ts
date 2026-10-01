import { describe, it, expect, afterEach, vi } from 'vitest'
import { rangoMesActual } from './mes'

describe('rangoMesActual', () => {
  it('va del día 1 al último del mes', () => {
    expect(rangoMesActual('2026-09-15')).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' })
  })

  it('un mes de 31 días', () => {
    expect(rangoMesActual('2026-10-01')).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' })
  })

  it('febrero de año bisiesto', () => {
    expect(rangoMesActual('2028-02-10')).toEqual({ desde: '2028-02-01', hasta: '2028-02-29' })
  })

  it('febrero de año normal', () => {
    expect(rangoMesActual('2026-02-10')).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' })
  })

  it('el último día del mes sigue siendo ese mes', () => {
    expect(rangoMesActual('2026-09-30')).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' })
  })
})

describe('rangoMesActual — el mes se resuelve en Lima, no en el servidor', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  /*
    El fallo que lo trajo aquí: el servidor es Vercel y corre en UTC, cinco
    horas por delante de Lima. A las 20:08 del 30 de septiembre en Lima, en UTC
    ya es el 1 de octubre, y Finanzas, Gastos y el periodo por defecto de
    Reportes saltaban de mes una tarde antes de tiempo.

    En el portátil del laboratorio no se veía, porque ahí la zona del sistema
    ya es la de Perú: solo aparecía en producción.
  */
  it('la tarde del último día de mes no salta al siguiente', () => {
    // 2026-10-01T01:08Z = 2026-09-30 20:08 en Lima.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-01T01:08:00Z'))

    expect(rangoMesActual()).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' })
  })

  it('pasada la medianoche de Lima sí cambia de mes', () => {
    // 2026-10-01T05:30Z = 2026-10-01 00:30 en Lima.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-01T05:30:00Z'))

    expect(rangoMesActual()).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' })
  })

  it('al mediodía no hay diferencia posible', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T17:00:00Z'))

    expect(rangoMesActual()).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' })
  })
})
