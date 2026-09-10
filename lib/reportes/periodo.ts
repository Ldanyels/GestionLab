import { rangoDePeriodo, type Rango } from '@/lib/trabajos/periodo'

/**
 * Periodos del reporte.
 *
 * Son los de la lista de Trabajos con dos diferencias, y las dos vienen de que
 * un reporte se entrega por mes:
 *
 * - Añade `mes`, que además es el valor por omisión.
 * - **No incluye `todo`.** Un reporte sin límite de fechas traería el historial
 *   completo del laboratorio, que no es un reporte de nada: se imprime, se
 *   entrega a un doctor y tiene que cubrir un periodo concreto.
 */
export const PERIODOS_REPORTE = ['mes', 'hoy', '7d', '30d', 'rango'] as const
export type PeriodoReporte = (typeof PERIODOS_REPORTE)[number]

export const ETIQUETA_PERIODO_REPORTE: Record<PeriodoReporte, string> = {
  mes: 'Este mes',
  hoy: 'Hoy',
  '7d': '7 días',
  '30d': '30 días',
  rango: 'Rango…',
}

/** Valida el parámetro de la URL. Cualquier cosa desconocida cae en el mes. */
export function resolverPeriodoReporte(valor: string | undefined): PeriodoReporte {
  return (PERIODOS_REPORTE as readonly string[]).includes(valor ?? '')
    ? (valor as PeriodoReporte)
    : 'mes'
}

/**
 * Rango de fechas del periodo elegido.
 *
 * Delega en `rangoDePeriodo` de Trabajos para los periodos compartidos, para
 * que las dos pantallas no discrepen sobre qué son «7 días». Solo resuelve por
 * su cuenta lo propio: el mes, y que un rango vacío caiga al mes en vez de
 * quedarse sin límites.
 */
export function rangoDeReporte(
  periodo: PeriodoReporte,
  hoy: string,
  mes: Rango,
  desde?: string,
  hasta?: string,
): Rango {
  if (periodo === 'mes') return mes
  return rangoDePeriodo(periodo, hoy, desde, hasta) ?? mes
}
