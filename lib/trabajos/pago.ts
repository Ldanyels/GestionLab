/**
 * Filtro por situación de cobro de la lista de Trabajos.
 *
 * Solo distingue si queda saldo o no. No separa el pago parcial: el
 * laboratorio trabaja a crédito —19 de 20 trabajos no tienen ningún abono— así
 * que una pastilla de "parcial" estaría siempre en cero. La tarjeta ya muestra
 * "Debe S/ X", que dice cuánto falta en cada caso.
 */

export const FILTROS_PAGO = ['cualquiera', 'por_cobrar', 'pagados'] as const
export type FiltroPago = (typeof FILTROS_PAGO)[number]

export const ETIQUETA_FILTRO_PAGO: Record<FiltroPago, string> = {
  cualquiera: 'Cualquiera',
  por_cobrar: 'Por cobrar',
  pagados: 'Pagados',
}

/**
 * Umbral de deuda: un milésimo de sol.
 *
 * Por debajo es residuo de redondeo, no deuda. Es el mismo criterio que usan
 * los reportes y el estado de cuenta, para que las tres pantallas no discrepen
 * sobre si un trabajo está cobrado.
 */
const UMBRAL = 0.001

/** ¿Le queda saldo por cobrar? */
export function tieneSaldo(trabajo: { saldo: number }): boolean {
  return trabajo.saldo > UMBRAL
}

/** Valida el parámetro de la URL. Cualquier cosa desconocida cae en 'cualquiera'. */
export function resolverFiltroPago(valor: string | undefined): FiltroPago {
  return (FILTROS_PAGO as readonly string[]).includes(valor ?? '')
    ? (valor as FiltroPago)
    : 'cualquiera'
}

export function filtrarPorPago<T extends { saldo: number }>(
  lista: readonly T[],
  filtro: FiltroPago,
): T[] {
  switch (filtro) {
    case 'por_cobrar':
      return lista.filter(tieneSaldo)
    case 'pagados':
      return lista.filter((t) => !tieneSaldo(t))
    default:
      return [...lista]
  }
}

/** Cuántos trabajos caen en cada filtro, para el número de cada pastilla. */
export function contarPorPago(
  lista: readonly { saldo: number }[],
): Record<FiltroPago, number> {
  const porCobrar = lista.filter(tieneSaldo).length
  return {
    cualquiera: lista.length,
    por_cobrar: porCobrar,
    pagados: lista.length - porCobrar,
  }
}
