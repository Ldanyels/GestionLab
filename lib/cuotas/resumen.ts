import { diasDeMora } from './periodos'

export interface CuotaResumible {
  monto: number
  estado: 'pendiente' | 'pagada' | 'anulada'
  vence_el: string
  pagada_el: string | null
}

export interface ResumenDeCobranza {
  /** Cobrado en el mes de la fecha dada, por fecha de pago. */
  cobradoEnElMes: number
  /** Todo lo emitido y no pagado, haya vencido o no. */
  pendiente: number
  /** La parte de lo pendiente que ya venció: a quién hay que llamar hoy. */
  vencido: number
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Las tres cifras que dicen cómo va la cobranza.
 *
 * Las cuotas **anuladas no cuentan en nada**: se emitieron mal, así que no son
 * ingreso ni deuda. Dejarlas en «pendiente» inflaría la deuda con errores
 * propios; contarlas como cobradas sería peor.
 */
export function resumenDeCobranza(
  cuotas: readonly CuotaResumible[],
  hoy: string,
): ResumenDeCobranza {
  const mes = hoy.slice(0, 7)
  let cobrado = 0
  let pendiente = 0
  let vencido = 0

  for (const c of cuotas) {
    if (c.estado === 'anulada') continue
    if (c.estado === 'pagada') {
      if (c.pagada_el?.slice(0, 7) === mes) cobrado += c.monto
      continue
    }
    pendiente += c.monto
    if (diasDeMora(c.vence_el, hoy) > 0) vencido += c.monto
  }

  return { cobradoEnElMes: r2(cobrado), pendiente: r2(pendiente), vencido: r2(vencido) }
}
