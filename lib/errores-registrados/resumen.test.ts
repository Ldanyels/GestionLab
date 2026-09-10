import { describe, it, expect } from 'vitest'
import { hace, resumenDeErrores, urgencia, type ErrorResumible } from './resumen'

const AHORA = '2026-09-10T20:00:00.000Z'

function err(parcial: Partial<ErrorResumible> = {}): ErrorResumible {
  return {
    veces: 1,
    ultima_vez: AHORA,
    laboratorios: [],
    resuelto_el: null,
    ...parcial,
  }
}

describe('hace', () => {
  it('los primeros segundos son «ahora mismo»', () => {
    expect(hace('2026-09-10T19:59:30.000Z', AHORA)).toBe('ahora mismo')
  })

  it('minutos', () => {
    expect(hace('2026-09-10T19:45:00.000Z', AHORA)).toBe('hace 15 min')
  })

  it('horas, en singular y plural', () => {
    expect(hace('2026-09-10T19:00:00.000Z', AHORA)).toBe('hace 1 hora')
    expect(hace('2026-09-10T15:00:00.000Z', AHORA)).toBe('hace 5 horas')
  })

  it('días', () => {
    expect(hace('2026-09-08T20:00:00.000Z', AHORA)).toBe('hace 2 días')
  })

  /*
    Un reloj adelantado en el navegador o una fila escrita por un servidor con
    otra hora no deben producir «hace -3 min», que parece un fallo del sistema
    de errores y hace desconfiar de todo lo demás de la pantalla.
  */
  it('una fecha futura no da un número negativo', () => {
    expect(hace('2026-09-10T20:05:00.000Z', AHORA)).toBe('ahora mismo')
  })
})

describe('urgencia', () => {
  /*
    Lo que ordena la lista no es la cantidad de errores sino cuánta gente los
    está sufriendo ahora: un fallo que afecta a tres laboratorios hoy va antes
    que uno que ocurrió cien veces el mes pasado y ya nadie ve.
  */
  it('lo que le pasa a varios laboratorios pesa más', () => {
    const uno = err({ veces: 50, laboratorios: ['a'] })
    const varios = err({ veces: 5, laboratorios: ['a', 'b', 'c'] })
    expect(urgencia(varios, AHORA)).toBeGreaterThan(urgencia(uno, AHORA))
  })

  it('lo reciente pesa más que lo viejo', () => {
    const reciente = err({ veces: 2 })
    const viejo = err({ veces: 2, ultima_vez: '2026-08-01T20:00:00.000Z' })
    expect(urgencia(reciente, AHORA)).toBeGreaterThan(urgencia(viejo, AHORA))
  })

  it('lo resuelto queda al final', () => {
    const resuelto = err({ veces: 99, laboratorios: ['a', 'b'], resuelto_el: AHORA })
    expect(urgencia(resuelto, AHORA)).toBe(0)
  })
})

describe('resumenDeErrores', () => {
  it('sin errores, todo en cero', () => {
    expect(resumenDeErrores([], AHORA)).toEqual({
      sinResolver: 0,
      delDia: 0,
      laboratoriosAfectados: 0,
    })
  })

  it('cuenta los tipos sin resolver, no las ocurrencias', () => {
    const r = resumenDeErrores([err({ veces: 40 }), err({ veces: 3 })], AHORA)
    expect(r.sinResolver).toBe(2)
  })

  it('no cuenta los resueltos', () => {
    const r = resumenDeErrores([err(), err({ resuelto_el: AHORA })], AHORA)
    expect(r.sinResolver).toBe(1)
  })

  it('«del día» son las últimas 24 horas', () => {
    const r = resumenDeErrores(
      [err(), err({ ultima_vez: '2026-09-09T10:00:00.000Z' })],
      AHORA,
    )
    expect(r.delDia).toBe(1)
  })

  /*
    Un laboratorio que sufre tres errores distintos es **un** laboratorio con
    problemas. Sumar los arreglos sin unir daría tres y exageraría el alcance.
  */
  it('los laboratorios afectados no se cuentan dos veces', () => {
    const r = resumenDeErrores(
      [err({ laboratorios: ['a', 'b'] }), err({ laboratorios: ['b', 'c'] })],
      AHORA,
    )
    expect(r.laboratoriosAfectados).toBe(3)
  })

  it('un error resuelto no cuenta como laboratorio afectado', () => {
    const r = resumenDeErrores([err({ laboratorios: ['a'], resuelto_el: AHORA })], AHORA)
    expect(r.laboratoriosAfectados).toBe(0)
  })
})
