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
/*
  El orden es el que pidió el laboratorio, y la lista también: se quitaron
  «Mes anterior», «7 días» y «30 días» porque en esta pantalla no se usaban —un
  reporte se pide por mes o por un rango concreto— y seis atajos en una fila
  tapaban los tres que sí.
*/
export const PERIODOS_REPORTE = ['rango', 'hoy', 'mes'] as const
export type PeriodoReporte = (typeof PERIODOS_REPORTE)[number]

export const ETIQUETA_PERIODO_REPORTE: Record<PeriodoReporte, string> = {
  rango: 'Rango…',
  hoy: 'Hoy',
  mes: 'Este mes',
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
