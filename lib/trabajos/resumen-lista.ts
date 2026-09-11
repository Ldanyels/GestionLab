/**
 * Resumen de lo que quedó en la lista después de filtrar.
 *
 * Existe porque la barra de filtros contaba trabajos y nunca soles. En un
 * laboratorio que trabaja a crédito, filtrar «entregados por cobrar» y leer
 * "12" no responde nada: la pregunta es cuánto. El dato ya está en memoria,
 * solo faltaba decirlo.
 */
import { formatMoney } from '@/lib/format'

export interface ResumenLista {
  /** "12 trabajos" · cadena vacía si no hay resultados. */
  conteo: string
  /** "S/ 4,320.00 por cobrar" · "todo cobrado" · `null` si no ve importes. */
  monto: string | null
  hayDeuda: boolean
}

/** Igual que en el filtro de cobro: por debajo de un milésimo es redondeo. */
const UMBRAL = 0.001

export function resumenLista(
  lista: readonly { saldo: number }[],
  montos: boolean,
): ResumenLista {
  if (lista.length === 0) return { conteo: '', monto: null, hayDeuda: false }

  const conteo = `${lista.length} ${lista.length === 1 ? 'trabajo' : 'trabajos'}`
  if (!montos) return { conteo, monto: null, hayDeuda: false }

  // Solo se suman los saldos positivos: un pago en exceso en un trabajo no
  // cancela la deuda de otro.
  const saldo =
    Math.round(lista.reduce((s, t) => s + Math.max(0, t.saldo), 0) * 100) / 100
  const hayDeuda = saldo > UMBRAL

  return {
    conteo,
    monto: hayDeuda ? `${formatMoney(saldo)} por cobrar` : 'todo cobrado',
    hayDeuda,
  }
}

/**
 * El mismo resumen cuando el conteo y los saldos vienen de la base por separado.
 *
 * Con la lista paginada ya no existe «la lista filtrada» en memoria: el total
 * lo da un conteo que no devuelve filas, y los saldos una consulta de una sola
 * columna. Esta función junta las dos piezas sin que el texto que se muestra
 * dependa de cuál de los dos caminos se usó.
 */
export function resumenDeConsulta(
  total: number,
  saldos: readonly number[],
  montos: boolean,
): ResumenLista {
  if (total === 0) return { conteo: '', monto: null, hayDeuda: false }

  const conteo = `${total} ${total === 1 ? 'trabajo' : 'trabajos'}`
  if (!montos) return { conteo, monto: null, hayDeuda: false }

  const saldo = Math.round(saldos.reduce((s, v) => s + Math.max(0, v), 0) * 100) / 100
  const hayDeuda = saldo > UMBRAL

  return {
    conteo,
    monto: hayDeuda ? `${formatMoney(saldo)} por cobrar` : 'todo cobrado',
    hayDeuda,
  }
}
