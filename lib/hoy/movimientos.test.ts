import { describe, it, expect } from 'vitest'
import {
  ETIQUETA_MOVIMIENTO,
  MOVIMIENTOS,
  movimientosDelDia,
  type TrabajoConMovimientos,
} from './movimientos'

const HOY = '2026-09-18'

function t(p: Partial<TrabajoConMovimientos> = {}): TrabajoConMovimientos {
  return {
    id: 't1',
    fecha_ingreso: '2026-09-01',
    entregado_el: null,
    cerrado_el: null,
    cobrado_el: [],
    cobrado_hoy: 0,
    ...p,
  }
}

describe('MOVIMIENTOS', () => {
  it('son los cuatro que ocurren sobre un trabajo', () => {
    expect(MOVIMIENTOS).toEqual(['ingreso', 'cierre', 'entrega', 'cobro'])
  })

  it('cada uno tiene su etiqueta', () => {
    for (const m of MOVIMIENTOS) expect(ETIQUETA_MOVIMIENTO[m]).toBeTruthy()
  })
})

describe('movimientosDelDia', () => {
  it('un trabajo que ingresó hoy', () => {
    const r = movimientosDelDia([t({ fecha_ingreso: HOY })], HOY)
    expect(r).toHaveLength(1)
    expect(r[0]!.movimientos).toEqual(['ingreso'])
  })

  /*
    El motivo de todo esto: un trabajo que entró la semana pasada y se entregó
    hoy es producción de hoy. Antes la pantalla solo miraba la fecha de
    ingreso, así que ese trabajo no aparecía en ningún sitio.
  */
  it('un trabajo de otro día que se entregó hoy', () => {
    const r = movimientosDelDia([t({ fecha_ingreso: '2026-09-01', entregado_el: HOY })], HOY)
    expect(r[0]!.movimientos).toEqual(['entrega'])
  })

  it('un trabajo de otro día que se cerró hoy', () => {
    const r = movimientosDelDia([t({ cerrado_el: HOY })], HOY)
    expect(r[0]!.movimientos).toEqual(['cierre'])
  })

  it('un trabajo de otro día que se cobró hoy', () => {
    const r = movimientosDelDia([t({ cobrado_el: [HOY], cobrado_hoy: 90 })], HOY)
    expect(r[0]!.movimientos).toEqual(['cobro'])
    expect(r[0]!.cobrado_hoy).toBe(90)
  })

  /*
    Un mismo trabajo puede moverse varias veces en el día: entra, se cierra y
    se cobra. Aparece **una vez** con sus tres movimientos, no tres veces: la
    pantalla cuenta trabajos, y repetirlo haría parecer que hubo más
    producción de la que hubo.
  */
  it('un trabajo con varios movimientos aparece una sola vez', () => {
    const r = movimientosDelDia(
      [t({ fecha_ingreso: HOY, cerrado_el: HOY, cobrado_el: [HOY], cobrado_hoy: 50 })],
      HOY,
    )
    expect(r).toHaveLength(1)
    expect(r[0]!.movimientos).toEqual(['ingreso', 'cierre', 'cobro'])
  })

  it('los movimientos salen siempre en el mismo orden', () => {
    const r = movimientosDelDia([t({ cobrado_el: [HOY], cobrado_hoy: 10, entregado_el: HOY })], HOY)
    expect(r[0]!.movimientos).toEqual(['entrega', 'cobro'])
  })

  it('lo que no se movió hoy no aparece', () => {
    const r = movimientosDelDia(
      [t({ fecha_ingreso: '2026-09-01', entregado_el: '2026-09-02', cerrado_el: '2026-09-02' })],
      HOY,
    )
    expect(r).toEqual([])
  })

  it('sin trabajos, lista vacía', () => {
    expect(movimientosDelDia([], HOY)).toEqual([])
  })

  /*
    Ordenado por lo que más interesa mirar: primero lo que salió del taller
    —entregas y cierres, que son producción terminada— y después lo que entró.
    El cobro solo no mueve un trabajo al principio: es dinero, no producción.
  */
  it('primero lo terminado, después lo que entró', () => {
    const r = movimientosDelDia(
      [
        t({ id: 'entro', fecha_ingreso: HOY }),
        t({ id: 'cobro', cobrado_el: [HOY], cobrado_hoy: 10 }),
        t({ id: 'entrego', entregado_el: HOY }),
        t({ id: 'cerro', cerrado_el: HOY }),
      ],
      HOY,
    )
    expect(r.map((x) => x.id)).toEqual(['entrego', 'cerro', 'entro', 'cobro'])
  })

  /*
    Un trabajo puede tener varios abonos el mismo día. Cuenta como un solo
    movimiento de cobro, con la suma: dos abonos del mismo paciente el mismo
    día son un cobro partido, no dos eventos.
  */
  it('varios abonos del mismo día son un solo cobro', () => {
    const r = movimientosDelDia([t({ cobrado_el: [HOY, HOY], cobrado_hoy: 140 })], HOY)
    expect(r[0]!.movimientos).toEqual(['cobro'])
    expect(r[0]!.cobrado_hoy).toBe(140)
  })
})
