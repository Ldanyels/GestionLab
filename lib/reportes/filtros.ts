import { rangoMesActual } from '@/lib/finanzas/data'
import type { FiltrosReporte } from './data'

export interface FiltrosResueltos extends FiltrosReporte {
  desde: string
  hasta: string
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

/** Normaliza los parámetros de la URL: por defecto, el mes actual. */
export function resolverFiltros(sp: {
  desde?: string
  hasta?: string
  consultorio?: string
  doctor?: string
}): FiltrosResueltos {
  const mes = rangoMesActual()
  return {
    desde: sp.desde && ISO.test(sp.desde) ? sp.desde : mes.desde,
    hasta: sp.hasta && ISO.test(sp.hasta) ? sp.hasta : mes.hasta,
    consultorioId: sp.consultorio || undefined,
    doctorId: sp.doctor || undefined,
  }
}

/** "01/09/2026 – 30/09/2026" para encabezados de reporte. */
export function etiquetaRango(desde: string, hasta: string): string {
  const f = (iso: string) => iso.split('-').reverse().join('/')
  return `${f(desde)} – ${f(hasta)}`
}
