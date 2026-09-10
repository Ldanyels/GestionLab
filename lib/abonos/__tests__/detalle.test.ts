import { describe, it, expect } from 'vitest'
import { detalleDeEdicion } from '../detalle'

const antes = {
  monto: 150,
  metodo: 'efectivo' as const,
  fecha: '2026-09-01',
  nota: null,
}

describe('detalleDeEdicion', () => {
  /*
    El monto anterior es la mitad que importa. «Alguien editó un abono» no le
    sirve de nada a un laboratorio que quiere saber si su cuenta cuadra;
    «cambió el monto de S/150.00 a S/50.00» sí.
  */
  it('guarda el monto anterior y el nuevo', () => {
    expect(detalleDeEdicion(antes, { ...antes, monto: 50 })).toBe(
      'cambió el monto del abono de S/ 150.00 a S/ 50.00',
    )
  })

  it('describe el cambio de método', () => {
    expect(detalleDeEdicion(antes, { ...antes, metodo: 'yape/plin' })).toBe(
      'cambió el método del abono de efectivo a yape/plin',
    )
  })

  it('describe el cambio de fecha', () => {
    expect(detalleDeEdicion(antes, { ...antes, fecha: '2026-09-05' })).toBe(
      'cambió la fecha del abono de 2026-09-01 a 2026-09-05',
    )
  })

  it('junta varios cambios en una frase', () => {
    expect(detalleDeEdicion(antes, { ...antes, monto: 50, metodo: 'yape/plin' })).toBe(
      'cambió el monto del abono de S/ 150.00 a S/ 50.00; cambió el método del abono de efectivo a yape/plin',
    )
  })

  it('nombra la nota vacía en vez de dejar un hueco', () => {
    expect(detalleDeEdicion(antes, { ...antes, nota: 'adelanto' })).toBe(
      'cambió la nota del abono de sin nota a «adelanto»',
    )
  })

  // Un formulario manda todos sus campos, también los que nadie tocó.
  it('sin cambios no describe nada', () => {
    expect(detalleDeEdicion(antes, { ...antes })).toBe('')
  })

  it('una fecha nula se nombra en vez de aparecer como hueco', () => {
    expect(detalleDeEdicion({ ...antes, fecha: null }, { ...antes, fecha: '2026-09-05' })).toBe(
      'cambió la fecha del abono de sin fecha a 2026-09-05',
    )
  })
})
