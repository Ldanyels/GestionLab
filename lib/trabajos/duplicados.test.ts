import { describe, it, expect } from 'vitest'
import {
  DIAS_DE_VENTANA,
  desdeQueFecha,
  hayCoincidencia,
  normalizarPaciente,
  type TrabajoComparable,
} from './duplicados'

function t(p: Partial<TrabajoComparable> = {}): TrabajoComparable {
  return {
    consultorio_id: 'c1',
    paciente_nombre: 'Jeremías',
    tipos: ['tipo-corona'],
    ...p,
  }
}

describe('normalizarPaciente', () => {
  /*
    «Jeremias», «jeremías» y « Jeremías » son la misma persona. Sin normalizar,
    el filtro no detectaría nada: dos técnicos distintos casi nunca escriben un
    nombre exactamente igual.
  */
  it('ignora tildes, mayúsculas y espacios', () => {
    expect(normalizarPaciente('  JEREMÍAS  ')).toBe('jeremias')
    expect(normalizarPaciente('Jeremias')).toBe('jeremias')
  })

  it('colapsa los espacios de en medio', () => {
    expect(normalizarPaciente('Luis   Angel')).toBe('luis angel')
  })

  /*
    Sin paciente no hay nada que comparar. Devuelve `null` y no cadena vacía
    para que dos trabajos sin paciente **no** se consideren el mismo paciente:
    en los datos reales, los cuatro pares repetidos sin paciente eran encargos
    legítimos del mismo consultorio, no duplicados.
  */
  it('sin nombre devuelve null, no cadena vacía', () => {
    expect(normalizarPaciente(null)).toBeNull()
    expect(normalizarPaciente('')).toBeNull()
    expect(normalizarPaciente('   ')).toBeNull()
  })
})

describe('hayCoincidencia', () => {
  it('coinciden consultorio, paciente y tipo', () => {
    expect(hayCoincidencia(t(), t())).toBe(true)
  })

  it('otro consultorio no coincide', () => {
    expect(hayCoincidencia(t(), t({ consultorio_id: 'c2' }))).toBe(false)
  })

  it('otro paciente no coincide', () => {
    expect(hayCoincidencia(t(), t({ paciente_nombre: 'Luis angel' }))).toBe(false)
  })

  it('otro tipo de trabajo no coincide', () => {
    expect(hayCoincidencia(t(), t({ tipos: ['tipo-perno'] }))).toBe(false)
  })

  it('el mismo paciente escrito distinto sí coincide', () => {
    expect(hayCoincidencia(t({ paciente_nombre: 'Jeremias' }), t())).toBe(true)
  })

  /*
    Basta con que compartan **un** tipo. Un trabajo de «corona + perno» y otro
    de «corona» para el mismo paciente del mismo consultorio en cinco días son
    lo bastante parecidos como para preguntar; exigir que las listas fueran
    idénticas dejaría pasar el caso más habitual de duplicado parcial.
  */
  it('basta con que compartan un tipo', () => {
    expect(
      hayCoincidencia(t({ tipos: ['corona', 'perno'] }), t({ tipos: ['corona'] })),
    ).toBe(true)
  })

  /*
    La regla que evita los falsos avisos. Las tres validaciones son
    consultorio + paciente + tipo, y sin paciente una de las tres no se puede
    comprobar: dos trabajos sin nombre no son «el mismo paciente».
  */
  it('sin paciente no se avisa, aunque todo lo demás coincida', () => {
    expect(
      hayCoincidencia(t({ paciente_nombre: null }), t({ paciente_nombre: null })),
    ).toBe(false)
  })

  it('tampoco si solo uno de los dos tiene paciente', () => {
    expect(hayCoincidencia(t({ paciente_nombre: null }), t())).toBe(false)
    expect(hayCoincidencia(t(), t({ paciente_nombre: null }))).toBe(false)
  })

  it('sin tipos no hay nada que comparar', () => {
    expect(hayCoincidencia(t({ tipos: [] }), t())).toBe(false)
  })
})

describe('ventana de cinco días', () => {
  it('son cinco días', () => {
    expect(DIAS_DE_VENTANA).toBe(5)
  })

  it('mira cinco días hacia atrás desde la fecha de ingreso', () => {
    expect(desdeQueFecha('2026-09-16')).toBe('2026-09-11')
  })

  it('cruza el fin de mes', () => {
    expect(desdeQueFecha('2026-09-03')).toBe('2026-08-29')
  })

  it('cruza el fin de año', () => {
    expect(desdeQueFecha('2027-01-02')).toBe('2026-12-28')
  })
})
