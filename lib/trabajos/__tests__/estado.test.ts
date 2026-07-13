import { describe, it, expect } from 'vitest'
import { progresoTrabajo, siguienteEstadoEtapa } from '@/lib/trabajos/estado'

describe('progresoTrabajo', () => {
  it('0% sin etapas', () => {
    expect(progresoTrabajo([])).toBe(0)
  })
  it('ignora las excluidas en el cálculo', () => {
    // 1 completada de 2 aplicables (una excluida no cuenta) = 50%
    expect(
      progresoTrabajo([
        { estado: 'completada' },
        { estado: 'pendiente' },
        { estado: 'excluida' },
      ]),
    ).toBe(50)
  })
  it('100% cuando todas las aplicables están completadas', () => {
    expect(
      progresoTrabajo([{ estado: 'completada' }, { estado: 'excluida' }]),
    ).toBe(100)
  })
})

describe('siguienteEstadoEtapa', () => {
  it('pendiente → en_progreso → completada', () => {
    expect(siguienteEstadoEtapa('pendiente')).toBe('en_progreso')
    expect(siguienteEstadoEtapa('en_progreso')).toBe('completada')
  })
  it('completada y excluida no avanzan', () => {
    expect(siguienteEstadoEtapa('completada')).toBe('completada')
    expect(siguienteEstadoEtapa('excluida')).toBe('excluida')
  })
})
