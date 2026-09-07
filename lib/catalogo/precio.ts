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

/**
 * Precio total del trabajo: cantidad de piezas × precio efectivo por pieza.
 * Cantidades inválidas o menores a 1 se tratan como 1.
 */
export function precioTotalTrabajo(
  item: Pick<CatalogoTrabajo, 'precio_base' | 'variable_precio_unitario'>,
  cantidad: number,
  cantidadVariable = 0,
): number {
  const piezas = Number.isFinite(cantidad) ? Math.max(1, Math.trunc(cantidad)) : 1
  return Math.round(piezas * precioEfectivo(item, cantidadVariable) * 100) / 100
}
