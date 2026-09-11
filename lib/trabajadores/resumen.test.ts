import { describe, it, expect } from 'vitest'
import { resumenDeManoDeObra, type PagoResumible } from './resumen'

function pago(p: Partial<PagoResumible>): PagoResumible {
  return { trabajador_id: 'a', trabajador: 'Marlon', monto: 100, ...p }
}

describe('resumenDeManoDeObra', () => {
  it('suma lo pagado a cada trabajador', () => {
    const r = resumenDeManoDeObra(
      [
        pago({ trabajador_id: 'a', trabajador: 'Marlon', monto: 300 }),
        pago({ trabajador_id: 'a', trabajador: 'Marlon', monto: 200 }),
        pago({ trabajador_id: 'b', trabajador: 'Rosa', monto: 400 }),
      ],
      2000,
    )
    expect(r.porTrabajador).toEqual([
      { trabajador_id: 'a', trabajador: 'Marlon', monto: 500, pagos: 2 },
      { trabajador_id: 'b', trabajador: 'Rosa', monto: 400, pagos: 1 },
    ])
    expect(r.total).toBe(900)
  })

  it('ordena de mayor a menor', () => {
    const r = resumenDeManoDeObra(
      [
        pago({ trabajador_id: 'a', trabajador: 'Marlon', monto: 100 }),
        pago({ trabajador_id: 'b', trabajador: 'Rosa', monto: 900 }),
      ],
      2000,
    )
    expect(r.porTrabajador.map((t) => t.trabajador)).toEqual(['Rosa', 'Marlon'])
  })

  /*
    El porcentaje sobre ingresos es el número que dice si el negocio aguanta.
    Un laboratorio que se lleva el 70% de lo que factura en mano de obra tiene
    un problema, y el importe suelto —S/900— no lo delata.
  */
  it('calcula qué parte de los ingresos se va en mano de obra', () => {
    const r = resumenDeManoDeObra([pago({ monto: 500 })], 2000)
    expect(r.porcentajeDeIngresos).toBe(25)
  })

  /*
    Sin ingresos el porcentaje es 0 y no infinito. Dividir entre cero imprimiría
    «Infinity%» en la pantalla de Finanzas del primer mes de un laboratorio
    nuevo, que es justo cuando se está decidiendo si el sistema sirve.
  */
  it('sin ingresos el porcentaje es cero, no infinito', () => {
    const r = resumenDeManoDeObra([pago({ monto: 500 })], 0)
    expect(r.porcentajeDeIngresos).toBe(0)
  })

  it('sin pagos, todo en cero', () => {
    const r = resumenDeManoDeObra([], 2000)
    expect(r).toEqual({ porTrabajador: [], total: 0, porcentajeDeIngresos: 0 })
  })

  it('redondea el total a céntimos', () => {
    const r = resumenDeManoDeObra(
      [pago({ monto: 33.33 }), pago({ monto: 33.33 }), pago({ monto: 33.33 })],
      100,
    )
    expect(r.total).toBe(99.99)
  })

  /*
    Un pago cuyo trabajador se borró no desaparece de la suma: el dinero salió
    igual. Omitirlo haría que el total de mano de obra no cuadrara con el
    desglose de gastos, y nadie podría explicar la diferencia.
  */
  it('un pago sin trabajador conocido sigue contando', () => {
    const r = resumenDeManoDeObra(
      [pago({ trabajador_id: 'x', trabajador: null, monto: 250 })],
      1000,
    )
    expect(r.total).toBe(250)
    expect(r.porTrabajador[0]?.trabajador).toBe('Trabajador eliminado')
  })
})
