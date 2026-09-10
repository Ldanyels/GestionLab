import { describe, it, expect } from 'vitest'
import {
  cambiosEfectivos,
  detalleDeAbonoBorrado,
  detalleDeCorreccion,
  detalleDePrecioBase,
} from './correcciones'

const antes = {
  precio_acordado: 350,
  estado: 'en_curso' as const,
  fecha_ingreso: '2026-09-01',
  entregado_el: null,
}

describe('cambiosEfectivos', () => {
  // Un formulario manda todos sus campos, también los que nadie tocó. Sin este
  // filtro, cada guardado registraría cambios que no ocurrieron.
  it('descarta los campos que llegan iguales', () => {
    expect(cambiosEfectivos(antes, { precio_acordado: 350, estado: 'en_curso' })).toEqual({})
  })

  it('conserva solo lo que de verdad cambia', () => {
    expect(cambiosEfectivos(antes, { precio_acordado: 400, estado: 'en_curso' })).toEqual({
      precio_acordado: 400,
    })
  })

  it('distingue vaciar una fecha de no tocarla', () => {
    expect(cambiosEfectivos(antes, { entregado_el: null })).toEqual({})
    expect(cambiosEfectivos(antes, { entregado_el: '2026-09-09' })).toEqual({
      entregado_el: '2026-09-09',
    })
  })
})

describe('detalleDeCorreccion', () => {
  // Lo que hace útil el historial: el laboratorio necesita saber de cuánto era
  // el precio antes, no solo que alguien lo cambió.
  it('guarda el valor anterior y el nuevo', () => {
    expect(detalleDeCorreccion(antes, { precio_acordado: 400 })).toBe(
      'cambió el precio de S/ 350.00 a S/ 400.00',
    )
  })

  it('traduce el estado a la palabra que ve el usuario', () => {
    expect(detalleDeCorreccion(antes, { estado: 'entregado' })).toBe(
      'cambió el estado de En curso a Entregado',
    )
  })

  it('describe varios cambios en una sola frase', () => {
    expect(detalleDeCorreccion(antes, { precio_acordado: 400, estado: 'cerrado' })).toBe(
      'cambió el precio de S/ 350.00 a S/ 400.00; cambió el estado de En curso a Cerrado',
    )
  })

  it('nombra la fecha de entrega vacía en lugar de dejar un hueco', () => {
    expect(detalleDeCorreccion(antes, { entregado_el: '2026-09-09' })).toBe(
      'cambió la fecha de entrega de sin registrar a 2026-09-09',
    )
  })

  it('sin cambios no describe nada', () => {
    expect(detalleDeCorreccion(antes, {})).toBe('')
  })
})

describe('detalleDeAbonoBorrado', () => {
  it('deja constancia del importe y la fecha, que es lo que se perdió', () => {
    expect(detalleDeAbonoBorrado({ monto: 100, fecha: '2026-09-01' })).toBe(
      'borró un abono de S/ 100.00 del 2026-09-01',
    )
  })

  it('tolera un abono sin fecha', () => {
    expect(detalleDeAbonoBorrado({ monto: 100, fecha: null })).toBe(
      'borró un abono de S/ 100.00',
    )
  })
})

describe('detalleDePrecioBase', () => {
  // Otra vez el valor anterior: es lo que permite al laboratorio saber si el
  // precio que ve hoy es el que tenía o uno que le tocaron.
  it('nombra el tipo de trabajo y los dos precios', () => {
    expect(detalleDePrecioBase('Corona porcelana', 120, 150)).toBe(
      'cambió el precio base de Corona porcelana de S/ 120.00 a S/ 150.00',
    )
  })

  it('funciona a la baja', () => {
    expect(detalleDePrecioBase('Prótesis total', 400, 380)).toBe(
      'cambió el precio base de Prótesis total de S/ 400.00 a S/ 380.00',
    )
  })
})
