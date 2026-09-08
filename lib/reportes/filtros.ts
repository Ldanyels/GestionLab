import { rangoMesActual } from '@/lib/finanzas/data'
import type { FiltrosReporte } from './data'

export interface FiltrosResueltos extends FiltrosReporte {
  desde: string
  hasta: string
  /** true = solo trabajos con saldo pendiente (reporte de cobranza). */
  soloPendientes: boolean
}

export interface ParamsReporte {
  desde?: string
  hasta?: string
  consultorio?: string
  doctor?: string
  mostrar?: string
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Normaliza los parámetros de la URL. Por defecto: mes actual y solo lo
 * pendiente por cobrar (`mostrar=todos` incluye los trabajos ya pagados).
 */
export function resolverFiltros(sp: ParamsReporte): FiltrosResueltos {
  const mes = rangoMesActual()
  return {
    desde: sp.desde && ISO.test(sp.desde) ? sp.desde : mes.desde,
    hasta: sp.hasta && ISO.test(sp.hasta) ? sp.hasta : mes.hasta,
    consultorioId: sp.consultorio || undefined,
    doctorId: sp.doctor || undefined,
    soloPendientes: sp.mostrar !== 'todos',
  }
}

/** Query string que preserva los filtros activos entre pantallas y exportaciones. */
export function queryFiltros(f: FiltrosResueltos): string {
  const qs = new URLSearchParams()
  qs.set('desde', f.desde)
  qs.set('hasta', f.hasta)
  if (f.consultorioId) qs.set('consultorio', f.consultorioId)
  if (f.doctorId) qs.set('doctor', f.doctorId)
  if (!f.soloPendientes) qs.set('mostrar', 'todos')
  return qs.toString()
}

/** "01/09/2026 – 30/09/2026" para encabezados de reporte. */
export function etiquetaRango(desde: string, hasta: string): string {
  const f = (iso: string) => iso.split('-').reverse().join('/')
  return `${f(desde)} – ${f(hasta)}`
}
