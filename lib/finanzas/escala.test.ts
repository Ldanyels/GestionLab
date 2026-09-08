import { describe, it, expect } from 'vitest'
import { proporcion, etiquetaMes } from './escala'

describe('proporcion', () => {
  it('el máximo es 100 %', () => {
    expect(proporcion(500, 500)).toBe(100)
  })

  it('calcula el porcentaje relativo', () => {
    expect(proporcion(250, 1000)).toBe(25)
  })

  it('redondea a un decimal', () => {
    expect(proporcion(1, 3)).toBe(33.3)
  })

  it('con máximo cero devuelve cero', () => {
    expect(proporcion(0, 0)).toBe(0)
    expect(proporcion(10, 0)).toBe(0)
  })

  it('recorta negativos y valores por encima del máximo', () => {
    expect(proporcion(-50, 100)).toBe(0)
    expect(proporcion(150, 100)).toBe(100)
  })

  it('tolera valores no finitos', () => {
    expect(proporcion(Number.NaN, 100)).toBe(0)
  })
})

describe('etiquetaMes', () => {
  it('traduce el mes a tres letras', () => {
    expect(etiquetaMes('2026-09')).toBe('set')
    expect(etiquetaMes('2026-01')).toBe('ene')
    expect(etiquetaMes('2026-12')).toBe('dic')
  })

  it('devuelve la cadena original si no reconoce el mes', () => {
    expect(etiquetaMes('raro')).toBe('raro')
  })
})
