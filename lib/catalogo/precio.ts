import type { CatalogoTrabajo } from './types'

/**
 * Precio efectivo de un trabajo: precio base + (precio unitario variable × cantidad).
 * Ej. Prótesis telescópicas: 120 + 20 × nº de cofias.
 */
export function precioEfectivo(
  item: Pick<CatalogoTrabajo, 'precio_base' | 'variable_precio_unitario'>,
  cantidadVariable = 0,
): number {
  const unitario = item.variable_precio_unitario ?? 0
  const cantidad = Number.isFinite(cantidadVariable) ? Math.max(0, cantidadVariable) : 0
  return item.precio_base + unitario * cantidad
}
