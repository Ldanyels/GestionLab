/**
 * Atajos de monto para registrar un abono.
 *
 * El motivo: en el piloto hay 4 abonos registrados contra 43 trabajos con
 * saldo, unos S/9.260 sin cobrar en los papeles del sistema. La función de
 * registrar pagos existe desde el principio; lo que no existía era una forma de
 * hacerlo sin teclear el importe exacto y sin equivocarse, y el final normal de
 * un trabajo —cobrado del todo— es justamente el que más se repite.
 */

export interface AtajoDeMonto {
  etiqueta: string
  monto: number
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Los atajos que corresponden a un saldo.
 *
 * Vacío cuando no hay nada que cobrar: un botón «Todo (S/ 0)» solo puede
 * producir un abono de cero, y con saldo negativo —un pago de más— lo que hace
 * falta es corregir el abono anterior, no registrar otro.
 */
export function atajosDeMonto(saldo: number): AtajoDeMonto[] {
  if (saldo <= 0) return []

  const todo = r2(saldo)
  const mitad = r2(saldo / 2)

  // Con un saldo de un céntimo la mitad redondea al mismo valor, y dos botones
  // con el mismo importe y distinto nombre invitan al error.
  return mitad > 0 && mitad !== todo
    ? [
        { etiqueta: 'Todo', monto: todo },
        { etiqueta: 'Mitad', monto: mitad },
      ]
    : [{ etiqueta: 'Todo', monto: todo }]
}
