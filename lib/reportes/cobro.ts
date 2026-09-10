import { contarPorPago, filtrarPorPago, type FiltroPago } from '@/lib/trabajos/pago'
import { saldoFila, type FilaReporte } from './agrupar'

/**
 * Filtra las filas del reporte por situación de cobro.
 *
 * Envuelve el filtro de Trabajos en vez de repetir su lógica: allí las filas
 * traen `saldo` calculado y aquí traen `total` y `pagado`, así que se adapta la
 * forma y se delega. Lo que importa de esa delegación es el umbral —por debajo
 * de un milésimo de sol es residuo de redondeo, no deuda—, que así queda
 * escrito en un solo sitio para las tres pantallas que lo usan.
 */
export function filtrarFilasPorCobro(
  filas: readonly FilaReporte[],
  filtro: FiltroPago,
): FilaReporte[] {
  const conSaldo = filas.map((fila) => ({ fila, saldo: saldoFila(fila) }))
  return filtrarPorPago(conSaldo, filtro).map((x) => x.fila)
}

/** Cuántas filas caen en cada situación, para el número de cada ficha. */
export function contarFilasPorCobro(
  filas: readonly FilaReporte[],
): Record<FiltroPago, number> {
  return contarPorPago(filas.map((fila) => ({ saldo: saldoFila(fila) })))
}
