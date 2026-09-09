/**
 * Los filtros de la lista de Trabajos: cómo se leen de la URL, cómo se
 * vuelven a escribir en ella y cómo se titula la combinación resultante.
 *
 * Todo el estado vive en la URL y no en el cliente: cada pastilla es un enlace,
 * así que la pantalla funciona sin JavaScript y cualquier vista se puede
 * compartir o guardar en marcadores tal como se ve.
 */
import type { EstadoTrabajo } from './estado'
import { resolverFiltroPago, type FiltroPago } from './pago'
import { resolverPeriodo, type Periodo } from './periodo'

const ESTADOS: readonly EstadoTrabajo[] = ['en_curso', 'cerrado', 'entregado']

export interface FiltrosTrabajos {
  estado?: EstadoTrabajo
  pago?: FiltroPago
  periodo?: Periodo
  desde?: string
  hasta?: string
  q?: string
}

/** Los filtros ya validados, con sus valores por defecto puestos. */
export interface FiltrosResueltos {
  estado: EstadoTrabajo | undefined
  pago: FiltroPago
  periodo: Periodo
  desde: string | undefined
  hasta: string | undefined
  q: string | undefined
}

export type ParametrosCrudos = Record<string, string | string[] | undefined>

function texto(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v
  return s ? s : undefined
}

/**
 * Lee los filtros de los parámetros de la URL, descartando lo inválido.
 *
 * Las fechas solo se conservan con el periodo de rango: son el único caso que
 * las usa, y arrastrarlas en los demás dejaría la URL con datos muertos que
 * confunden al depurar.
 */
export function resolverFiltrosTrabajos(sp: ParametrosCrudos): FiltrosResueltos {
  const estadoCrudo = texto(sp.estado)
  const periodo = resolverPeriodo(texto(sp.periodo))
  const esRango = periodo === 'rango'

  return {
    estado: ESTADOS.find((e) => e === estadoCrudo),
    pago: resolverFiltroPago(texto(sp.pago)),
    periodo,
    desde: esRango ? texto(sp.desde) : undefined,
    hasta: esRango ? texto(sp.hasta) : undefined,
    q: texto(sp.q),
  }
}

const TITULO_ESTADO: Record<EstadoTrabajo, string> = {
  en_curso: 'En curso',
  cerrado: 'Cerrados',
  entregado: 'Entregados',
}

const TITULO_PAGO: Record<FiltroPago, string> = {
  cualquiera: '',
  por_cobrar: 'por cobrar',
  pagados: 'pagados',
}

/**
 * Título de la pantalla según la combinación elegida.
 *
 * Es lo que hace que dos pastillas independientes se lean como una sola idea:
 * «Entregados» + «Por cobrar» encabeza la pantalla como "Entregados por
 * cobrar", que es como el cliente nombra esa vista.
 */
export function tituloTrabajos(
  estado: EstadoTrabajo | undefined,
  pago: FiltroPago,
): string {
  const base = estado ? TITULO_ESTADO[estado] : ''
  const sufijo = TITULO_PAGO[pago]

  if (!base && !sufijo) return 'Trabajos'
  if (!base) return sufijo.charAt(0).toUpperCase() + sufijo.slice(1)
  return sufijo ? `${base} ${sufijo}` : base
}

/**
 * Enlace a la lista con los filtros dados.
 *
 * Omite lo vacío y lo que ya es el valor por defecto, para que la URL diga solo
 * lo que se apartó de lo normal.
 */
export function enlaceTrabajos(f: FiltrosTrabajos): string {
  const params = new URLSearchParams()
  if (f.estado) params.set('estado', f.estado)
  if (f.pago && f.pago !== 'cualquiera') params.set('pago', f.pago)
  if (f.q) params.set('q', f.q)
  if (f.periodo && f.periodo !== 'todo') params.set('periodo', f.periodo)
  if (f.periodo === 'rango') {
    if (f.desde) params.set('desde', f.desde)
    if (f.hasta) params.set('hasta', f.hasta)
  }
  const qs = params.toString()
  return qs ? `/trabajos?${qs}` : '/trabajos'
}
