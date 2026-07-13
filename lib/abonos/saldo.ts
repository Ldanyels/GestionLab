export type EstadoPago = 'pendiente' | 'parcial' | 'pagado'

export const ETIQUETA_PAGO: Record<EstadoPago, string> = {
  pendiente: 'Pendiente',
  parcial: 'Pago parcial',
  pagado: 'Pagado',
}

export function totalPagado(abonos: ReadonlyArray<{ monto: number }>): number {
  return abonos.reduce((sum, a) => sum + a.monto, 0)
}

/** Saldo pendiente = precio − pagado. Puede ser 0 (o negativo si hubo exceso). */
export function saldoPendiente(
  precio: number,
  abonos: ReadonlyArray<{ monto: number }>,
): number {
  return Math.round((precio - totalPagado(abonos)) * 100) / 100
}

export function estadoPago(precio: number, pagado: number): EstadoPago {
  if (pagado <= 0) return 'pendiente'
  if (pagado + 0.001 < precio) return 'parcial'
  return 'pagado'
}
