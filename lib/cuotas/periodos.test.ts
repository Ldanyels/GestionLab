import { describe, it, expect } from 'vitest'
import {
  diasDeMora,
  finDePeriodo,
  periodosFaltantes,
  sumarMeses,
  vencimientoDe,
} from './periodos'

describe('sumarMeses', () => {
  it('avanza dentro del mismo año', () => {
    expect(sumarMeses('2026-09-15', 1)).toBe('2026-10-15')
  })

  it('cruza el fin de año', () => {
    expect(sumarMeses('2026-12-10', 1)).toBe('2027-01-10')
  })

  /*
    El error que no se ve hasta el mes seis: si el cobro empieza un 31, no
    todos los meses tienen 31. Sumar sin recortar haría que la aritmética de
    fechas se desbordara al mes siguiente —el 31 de enero más un mes daría 3 de
    marzo— y los periodos se irían corriendo solos.
  */
  it('recorta al último día del mes cuando el día no existe', () => {
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28')
    expect(sumarMeses('2026-03-31', 1)).toBe('2026-04-30')
    expect(sumarMeses('2026-08-31', 6)).toBe('2027-02-28')
  })

  it('respeta los años bisiestos', () => {
    expect(sumarMeses('2028-01-31', 1)).toBe('2028-02-29')
  })

  it('suma años como doce meses', () => {
    expect(sumarMeses('2026-09-15', 12)).toBe('2027-09-15')
  })
})

describe('finDePeriodo', () => {
  it('un mes termina el día antes del siguiente', () => {
    expect(finDePeriodo('2026-09-15', 'mensual')).toBe('2026-10-14')
  })

  it('un año termina el día antes del aniversario', () => {
    expect(finDePeriodo('2026-09-15', 'anual')).toBe('2027-09-14')
  })

  it('el mes de 31 días no deja huecos', () => {
    expect(finDePeriodo('2026-01-31', 'mensual')).toBe('2026-02-27')
  })
})

describe('vencimientoDe', () => {
  // Los términos fijan 15 días desde la emisión, y se emite al iniciar el
  // periodo porque se cobra por adelantado.
  it('vence 15 días después de emitirse', () => {
    expect(vencimientoDe('2026-09-01')).toBe('2026-09-16')
  })

  it('cruza el mes', () => {
    expect(vencimientoDe('2026-09-25')).toBe('2026-10-10')
  })
})

describe('periodosFaltantes', () => {
  it('desde el inicio hasta hoy, mes a mes', () => {
    const p = periodosFaltantes('2026-07-01', 'mensual', '2026-09-10', [])
    expect(p.map((x) => x.periodo_inicio)).toEqual([
      '2026-07-01',
      '2026-08-01',
      '2026-09-01',
    ])
  })

  // No se emiten cuotas de meses que no han empezado: sería cobrar por
  // adelantado algo que el cliente todavía puede cancelar.
  it('no adelanta periodos futuros', () => {
    const p = periodosFaltantes('2026-09-01', 'mensual', '2026-09-10', [])
    expect(p).toHaveLength(1)
  })

  it('el anual genera una sola, no doce', () => {
    const p = periodosFaltantes('2026-01-01', 'anual', '2026-09-10', [])
    expect(p).toHaveLength(1)
    expect(p[0]).toMatchObject({ periodo_inicio: '2026-01-01', periodo_fin: '2026-12-31' })
  })

  /*
    Lo que hace segura la generación al abrir el panel: si la pantalla se
    renderiza dos veces, la segunda no encuentra nada que generar.
  */
  it('no repite lo ya generado', () => {
    const p = periodosFaltantes('2026-07-01', 'mensual', '2026-09-10', [
      '2026-07-01',
      '2026-08-01',
    ])
    expect(p.map((x) => x.periodo_inicio)).toEqual(['2026-09-01'])
  })

  it('todo generado no devuelve nada', () => {
    const p = periodosFaltantes('2026-09-01', 'mensual', '2026-09-10', ['2026-09-01'])
    expect(p).toEqual([])
  })

  it('sin fecha de inicio no genera nada', () => {
    expect(periodosFaltantes(null, 'mensual', '2026-09-10', [])).toEqual([])
  })

  // Un laboratorio dado de alta con cobro futuro todavía no debe nada.
  it('un inicio posterior a hoy no genera nada', () => {
    expect(periodosFaltantes('2026-12-01', 'mensual', '2026-09-10', [])).toEqual([])
  })

  // Freno de seguridad: una fecha de inicio mal escrita (2016 en vez de 2026)
  // generaría cien cuotas de golpe.
  it('no genera más de 36 periodos de una vez', () => {
    const p = periodosFaltantes('2016-01-01', 'mensual', '2026-09-10', [])
    expect(p).toHaveLength(36)
  })
})

describe('diasDeMora', () => {
  it('sin vencer no hay mora', () => {
    expect(diasDeMora('2026-09-20', '2026-09-10')).toBe(0)
  })

  it('el mismo día del vencimiento tampoco', () => {
    expect(diasDeMora('2026-09-10', '2026-09-10')).toBe(0)
  })

  it('cuenta los días pasados del vencimiento', () => {
    expect(diasDeMora('2026-09-01', '2026-09-10')).toBe(9)
  })
})
