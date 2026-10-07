import { describe, it, expect, afterEach, vi } from 'vitest'
import { etiquetaDeMes, rangoMesActual, rangoMesAnterior } from './mes'

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

describe('rangoMesAnterior', () => {
  it('a mitad de octubre devuelve septiembre entero', () => {
    expect(rangoMesAnterior('2026-10-07')).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' })
  })

  /*
    El caso en que es más fácil equivocarse: restar uno al mes en enero da el
    mes cero. El laboratorio cierra el año igual que cualquier otro mes.
  */
  it('en enero retrocede a diciembre del año anterior', () => {
    expect(rangoMesAnterior('2027-01-03')).toEqual({ desde: '2026-12-01', hasta: '2026-12-31' })
  })

  it('en marzo de año bisiesto, febrero tiene 29', () => {
    expect(rangoMesAnterior('2028-03-01')).toEqual({ desde: '2028-02-01', hasta: '2028-02-29' })
  })

  it('en marzo de año normal, febrero tiene 28', () => {
    expect(rangoMesAnterior('2026-03-15')).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' })
  })

  it('el día 1 ya mira al mes cerrado', () => {
    expect(rangoMesAnterior('2026-10-01')).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' })
  })
})

describe('etiquetaDeMes', () => {
  it('nombra el mes y el año', () => {
    expect(etiquetaDeMes('2026-09-01')).toBe('setiembre 2026')
  })

  it('usa «setiembre», como lo escribe el laboratorio', () => {
    expect(etiquetaDeMes('2026-09-15')).not.toContain('septiembre')
  })

  it('enero y diciembre, los extremos', () => {
    expect(etiquetaDeMes('2026-01-01')).toBe('enero 2026')
    expect(etiquetaDeMes('2026-12-31')).toBe('diciembre 2026')
  })
})
