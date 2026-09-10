import { rangoMesActual } from '@/lib/finanzas/mes'
import { hoyLima } from '@/lib/trabajos/agenda'
import { campoFechaDe, type CampoFecha } from '@/lib/trabajos/periodo'
import { resolverFiltroPago, type FiltroPago } from '@/lib/trabajos/pago'
import type { EstadoTrabajo } from '@/lib/trabajos/estado'
import {
  rangoDeReporte,
  resolverPeriodoReporte,
  type PeriodoReporte,
} from './periodo'
import type { FiltrosReporte } from './data'

export interface FiltrosResueltos extends FiltrosReporte {
  desde: string
  hasta: string
  periodo: PeriodoReporte
  pago: FiltroPago
  /**
   * `true` = solo trabajos con saldo pendiente.
   *
   * Se deriva de `pago` y se conserva porque los títulos y los textos de esta
   * pantalla distinguen «Pendiente por cobrar» de «Reporte de trabajos».
   */
  soloPendientes: boolean
}

export interface ParamsReporte {
  desde?: string
  hasta?: string
  consultorio?: string
  doctor?: string
  estado?: string
  periodo?: string
  pago?: string
  /** Enlaces antiguos: `mostrar=todos` equivalía a no filtrar por cobro. */
  mostrar?: string
}

const ISO = /^\d{4}-\d{2}-\d{2}$/
const ESTADOS: readonly string[] = ['en_curso', 'cerrado', 'entregado']

/** Un estado inventado en la URL se descarta; vaciar el reporte sería peor. */
function resolverEstado(valor: string | undefined): EstadoTrabajo | undefined {
  return ESTADOS.includes(valor ?? '') ? (valor as EstadoTrabajo) : undefined
}

/**
 * Situación de cobro, con compatibilidad hacia atrás.
 *
 * Antes esta pantalla solo distinguía «pendientes» de «todos» con el parámetro
 * `mostrar`, y ese parámetro viaja en los PDF y tickets ya emitidos y en los
 * marcadores del usuario. Se sigue entendiendo.
 */
function resolverPago(sp: ParamsReporte): FiltroPago {
  if (sp.pago) return resolverFiltroPago(sp.pago)
  return sp.mostrar === 'todos' ? 'cualquiera' : 'por_cobrar'
}

/**
 * Normaliza los parámetros de la URL.
 *
 * Por defecto: mes en curso y solo lo pendiente por cobrar. El campo de fecha
 * que se acota depende del estado elegido —sobre entregados se acota por la
 * fecha real de entrega—, que es lo que permite preguntar «qué entregamos este
 * mes» en vez de «qué ingresó este mes y además ya salió».
 */
export function resolverFiltros(sp: ParamsReporte): FiltrosResueltos {
  const mes = rangoMesActual()
  const desdePedido = sp.desde && ISO.test(sp.desde) ? sp.desde : undefined
  const hastaPedido = sp.hasta && ISO.test(sp.hasta) ? sp.hasta : undefined

  // Unas fechas sueltas sin periodo son un rango a medida: así funcionaban los
  // enlaces antes de que existieran los periodos.
  const periodo = sp.periodo
    ? resolverPeriodoReporte(sp.periodo)
    : sp.desde || sp.hasta
      ? 'rango'
      : 'mes'

  const rango = rangoDeReporte(periodo, hoyLima(), mes, desdePedido, hastaPedido)
  const estado = resolverEstado(sp.estado)
  const pago = resolverPago(sp)

  return {
    desde: rango.desde,
    hasta: rango.hasta,
    periodo,
    consultorioId: sp.consultorio || undefined,
    doctorId: sp.doctor || undefined,
    estado,
    campoFecha: campoFechaDe(estado ?? null),
    pago,
    soloPendientes: pago === 'por_cobrar',
  }
}

/**
 * Query string que preserva los filtros entre pantallas y exportaciones.
 *
 * Los valores por omisión no se escriben: una URL con `pago=por_cobrar` y
 * `periodo=mes` no dice nada que el destino no vaya a asumir igual, y ensucia
 * el enlace que el usuario copia.
 */
export function queryFiltros(f: FiltrosResueltos): string {
  const qs = new URLSearchParams()
  qs.set('desde', f.desde)
  qs.set('hasta', f.hasta)
  if (f.periodo !== 'mes') qs.set('periodo', f.periodo)
  if (f.consultorioId) qs.set('consultorio', f.consultorioId)
  if (f.doctorId) qs.set('doctor', f.doctorId)
  if (f.estado) qs.set('estado', f.estado)
  if (f.pago !== 'por_cobrar') qs.set('pago', f.pago)
  return qs.toString()
}

/** El campo de fecha que se está acotando, para rotularlo. */
export function campoDeFecha(f: FiltrosResueltos): CampoFecha {
  return f.campoFecha ?? 'fecha_ingreso'
}

/** "01/09/2026 – 30/09/2026" para encabezados de reporte. */
export function etiquetaRango(desde: string, hasta: string): string {
  const f = (iso: string) => iso.split('-').reverse().join('/')
  return `${f(desde)} – ${f(hasta)}`
}

/**
 * Enlace al reporte con un filtro cambiado.
 *
 * Los controles navegan por enlaces, sin JavaScript, y el filtro vive en la
 * URL: el mismo patrón de la lista de Trabajos. Así el enlace se puede copiar y
 * el botón de atrás del navegador deshace un filtro.
 *
 * `desde` y `hasta` solo viajan con el periodo `rango`. Con cualquier otro los
 * calcula el servidor, y arrastrarlos dejaría en la URL unas fechas que ya no
 * describen lo que se está viendo.
 */
export function enlaceReporte(
  f: FiltrosResueltos,
  cambios: Partial<FiltrosResueltos> = {},
): string {
  const n = { ...f, ...cambios }
  const params = new URLSearchParams()
  if (n.periodo !== 'mes') params.set('periodo', n.periodo)
  if (n.periodo === 'rango') {
    params.set('desde', n.desde)
    params.set('hasta', n.hasta)
  }
  if (n.estado) params.set('estado', n.estado)
  if (n.pago !== 'por_cobrar') params.set('pago', n.pago)
  if (n.consultorioId) params.set('consultorio', n.consultorioId)
  if (n.doctorId) params.set('doctor', n.doctorId)
  const qs = params.toString()
  return qs ? `/reportes?${qs}` : '/reportes'
}
