import { describe, it, expect } from 'vitest'
import { atajosDeMonto } from './atajos'

describe('atajosDeMonto', () => {
  /*
    «Todo» es el atajo que importa: el final normal de un trabajo es saldo
    cero, y hasta ahora llegar ahí exigía teclear el importe exacto sin
    equivocarse. Ese tecleo es la razón por la que en el piloto hay 4 abonos
    para 43 trabajos con saldo.
  */
  it('ofrece el saldo completo', () => {
    expect(atajosDeMonto(120)).toContainEqual({ etiqueta: 'Todo', monto: 120 })
  })

  it('ofrece la mitad, para adelantos', () => {
    expect(atajosDeMonto(120)).toContainEqual({ etiqueta: 'Mitad', monto: 60 })
  })

  it('la mitad se redondea a céntimos', () => {
    expect(atajosDeMonto(33.33)).toContainEqual({ etiqueta: 'Mitad', monto: 16.67 })
  })

  /*
    Un trabajo ya pagado no ofrece atajos: no hay nada que cobrar, y un botón
    «Todo (S/ 0)» solo puede producir un abono de cero que ensucia el
    historial.
  */
  it('sin saldo no hay atajos', () => {
    expect(atajosDeMonto(0)).toEqual([])
  })

  /*
    Saldo negativo es un pago de más. Tampoco hay atajo: lo que hace falta ahí
    es corregir el abono anterior, no registrar otro.
  */
  it('con saldo negativo tampoco', () => {
    expect(atajosDeMonto(-30)).toEqual([])
  })

  /*
    Con un saldo de un céntimo, la mitad redondea al mismo céntimo y saldrían
    dos botones idénticos con distinto nombre, que es una forma de invitar al
    error.
  */
  it('no repite el mismo importe con dos nombres', () => {
    const atajos = atajosDeMonto(0.01)
    expect(atajos).toEqual([{ etiqueta: 'Todo', monto: 0.01 }])
  })
})
