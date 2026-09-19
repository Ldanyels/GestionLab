/**
 * Qué pasó hoy con cada trabajo.
 *
 * La pantalla Hoy mostraba solo lo que **ingresó** hoy. Pero un trabajo que
 * entró la semana pasada y se terminó esta mañana es producción de hoy, y no
 * aparecía en ninguna parte: para verlo había que recordar cuál era y buscarlo
 * en la lista.
 *
 * Aquí se juntan los cuatro movimientos que puede tener un trabajo en un día.
 * Cada trabajo aparece **una sola vez** con todos los suyos; repetirlo por cada
 * movimiento haría parecer que hubo más producción de la que hubo.
 */

export const MOVIMIENTOS = ['ingreso', 'cierre', 'entrega', 'cobro'] as const
export type Movimiento = (typeof MOVIMIENTOS)[number]

export const ETIQUETA_MOVIMIENTO: Record<Movimiento, string> = {
  ingreso: 'Ingresó',
  cierre: 'Se cerró',
  entrega: 'Se entregó',
  cobro: 'Se cobró',
}

export interface TrabajoConMovimientos {
  id: string
  fecha_ingreso: string
  entregado_el: string | null
  cerrado_el: string | null
  /** Fechas de los abonos del trabajo. Varias del mismo día son un solo cobro. */
  cobrado_el: readonly string[]
  /** Suma de lo cobrado en el día que se consulta. */
  cobrado_hoy: number
}

/**
 * El trabajo con sus movimientos del día encima.
 *
 * Se devuelve el trabajo entero y no un envoltorio `{trabajo, movimientos}`
 * porque quien lo consume es una tarjeta que necesita todos sus campos: con el
 * envoltorio, cada uso tendría que desempaquetarlo antes de pintarlo.
 */
export type ConMovimientos<T> = T & { movimientos: Movimiento[] }

/**
 * Peso para ordenar: primero lo que salió del taller.
 *
 * Entregas y cierres son producción terminada, que es lo que se quiere repasar
 * al final del día. El ingreso va después, y un cobro suelto al final: es
 * dinero, no producción, y tiene su propia pantalla.
 */
function prioridad(m: readonly Movimiento[]): number {
  if (m.includes('entrega')) return 0
  if (m.includes('cierre')) return 1
  if (m.includes('ingreso')) return 2
  return 3
}

export function movimientosDelDia<T extends TrabajoConMovimientos>(
  trabajos: readonly T[],
  dia: string,
): ConMovimientos<T>[] {
  const conMovimiento: ConMovimientos<T>[] = []

  for (const t of trabajos) {
    // El orden de estas comprobaciones fija el orden en que se muestran las
    // etiquetas de un mismo trabajo, que así es siempre el mismo.
    const movimientos: Movimiento[] = []
    if (t.fecha_ingreso === dia) movimientos.push('ingreso')
    if (t.cerrado_el === dia) movimientos.push('cierre')
    if (t.entregado_el === dia) movimientos.push('entrega')
    if (t.cobrado_el.includes(dia)) movimientos.push('cobro')

    if (movimientos.length > 0) {
      movimientos.sort((a, b) => MOVIMIENTOS.indexOf(a) - MOVIMIENTOS.indexOf(b))
      conMovimiento.push({ ...t, movimientos })
    }
  }

  return conMovimiento.sort((a, b) => prioridad(a.movimientos) - prioridad(b.movimientos))
}
