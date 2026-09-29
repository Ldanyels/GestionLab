import { describe, it, expect } from 'vitest'
import { fechasDeFila } from './fechas'

const fila = (fecha_ingreso: string, entregado_el: string | null) => ({
  fecha_ingreso,
  entregado_el,
})

describe('fechasDeFila', () => {
  it('un trabajo sin entregar muestra solo su ingreso', () => {
    expect(fechasDeFila(fila('2026-09-13', null))).toBe('2026-09-13')
  })

  it('un entregado muestra de cuándo entró a cuándo salió', () => {
    expect(fechasDeFila(fila('2026-09-13', '2026-09-18'))).toBe('2026-09-13 → 09-18')
  })

  /*
    Los 7 entregados que venían de antes de que la fecha se sellara sola. Una
    flecha hacia la nada no informa de nada, así que se comportan como los que
    no han salido.
  */
  it('un entregado sin fecha sellada no inventa una flecha', () => {
    expect(fechasDeFila(fila('2026-09-13', null))).toBe('2026-09-13')
  })

  it('cruzando el año, la entrega lo lleva entero', () => {
    expect(fechasDeFila(fila('2026-12-28', '2027-01-05'))).toBe('2026-12-28 → 2027-01-05')
  })

  describe('en pantalla, sin año', () => {
    it('solo ingreso', () => {
      expect(fechasDeFila(fila('2026-09-13', null), { corto: true })).toBe('09-13')
    })

    it('ingreso y entrega', () => {
      expect(fechasDeFila(fila('2026-09-13', '2026-09-18'), { corto: true })).toBe('09-13 → 09-18')
    })

    /*
      En pantalla el año se calla siempre: la fila es estrecha y el rango del
      reporte ya dice de qué año se está hablando.
    */
    it('cruzando el año sigue sin año', () => {
      expect(fechasDeFila(fila('2026-12-28', '2027-01-05'), { corto: true })).toBe('12-28 → 01-05')
    })
  })

  it('el mismo día de entrada y salida se dice igual', () => {
    expect(fechasDeFila(fila('2026-09-13', '2026-09-13'), { corto: true })).toBe('09-13 → 09-13')
  })
})
