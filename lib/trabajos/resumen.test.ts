import { describe, it, expect } from 'vitest'
import { resumenItems } from './resumen'

describe('resumenItems', () => {
  it('una línea de cantidad 1 muestra solo el nombre', () => {
    expect(resumenItems([{ cantidad: 1, nombre: 'Corona' }])).toBe('Corona')
  })

  it('antepone la cantidad cuando es mayor a 1', () => {
    expect(resumenItems([{ cantidad: 3, nombre: 'Corona' }])).toBe('3 × Corona')
  })

  it('une varias líneas con +', () => {
    expect(
      resumenItems([
        { cantidad: 2, nombre: 'Corona' },
        { cantidad: 1, nombre: 'Férula' },
      ]),
    ).toBe('2 × Corona + Férula')
  })

  it('sin líneas devuelve un guion', () => {
    expect(resumenItems([])).toBe('—')
  })
})
