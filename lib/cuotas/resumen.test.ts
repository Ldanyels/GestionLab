import { describe, it, expect } from 'vitest'
import { resumenDeCobranza, type CuotaResumible } from './resumen'

const cuota = (p: Partial<CuotaResumible>): CuotaResumible => ({
  monto: 250,
  estado: 'pendiente',
  vence_el: '2026-09-16',
  pagada_el: null,
  ...p,
})

const HOY = '2026-09-25'

describe('resumenDeCobranza', () => {
  it('suma lo cobrado en el mes de hoy', () => {
    const r = resumenDeCobranza(
      [
        cuota({ estado: 'pagada', pagada_el: '2026-09-05' }),
        cuota({ estado: 'pagada', pagada_el: '2026-09-20', monto: 350 }),
        // De otro mes: no cuenta en el del mes.
        cuota({ estado: 'pagada', pagada_el: '2026-08-05' }),
      ],
      HOY,
    )
    expect(r.cobradoEnElMes).toBe(600)
  })

  it('suma lo pendiente sin importar si venció', () => {
    const r = resumenDeCobranza(
      [cuota({}), cuota({ monto: 350, vence_el: '2026-10-16' })],
      HOY,
    )
    expect(r.pendiente).toBe(600)
  })

  // Lo vencido es el subconjunto que hay que ir a cobrar hoy.
  it('separa lo vencido de lo que aún no vence', () => {
    const r = resumenDeCobranza(
      [
        cuota({ vence_el: '2026-09-16' }),
        cuota({ vence_el: '2026-10-16', monto: 350 }),
      ],
      HOY,
    )
    expect(r.vencido).toBe(250)
    expect(r.pendiente).toBe(600)
  })

  // Una cuota anulada no es deuda ni ingreso: se emitió mal.
  it('las anuladas no cuentan en ningún total', () => {
    const r = resumenDeCobranza(
      [cuota({ estado: 'anulada' }), cuota({ estado: 'anulada', pagada_el: '2026-09-05' })],
      HOY,
    )
    expect(r).toMatchObject({ cobradoEnElMes: 0, pendiente: 0, vencido: 0 })
  })

  it('sin cuotas todo es cero', () => {
    expect(resumenDeCobranza([], HOY)).toMatchObject({
      cobradoEnElMes: 0,
      pendiente: 0,
      vencido: 0,
    })
  })

  it('redondea a dos decimales', () => {
    const r = resumenDeCobranza([cuota({ monto: 83.333 }), cuota({ monto: 83.333 })], HOY)
    expect(r.pendiente).toBe(166.67)
  })
})
