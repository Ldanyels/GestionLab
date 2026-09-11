import { diasEntre } from '@/lib/fechas'

/**
 * Métricas de los laboratorios, para decidir con datos y no por intuición.
 *
 * El origen de esto fue una pregunta concreta: ¿sigue siendo rentable cobrar
 * S/250 al mes? Medido, un laboratorio consume unos 2 GB de fotos y 1 GB de
 * descarga; caben 51 en el plan de $45. **La infraestructura no es la variable
 * que decide.**
 *
 * Lo que decide el ingreso es si el laboratorio sigue usando el sistema. Un
 * cliente que se va deja de registrar trabajos semanas antes de dejar de pagar,
 * y cuando aparece la cuota impagada ya se perdió. Por eso el centro de este
 * módulo es la actividad, no el consumo.
 */

export interface MetricaDeLaboratorio {
  laboratorio_id: string
  nombre: string
  plan: string
  estado: string
  precio_cuota: number | null
  periodicidad: string | null
  trabajos_7: number
  trabajos_previos_7: number
  trabajos_mes: number
  trabajos_total: number
  ultimo_trabajo: string | null
  fotos: number
  accesos_soporte: number
  /** Tipos de error abiertos que afectan a este laboratorio. */
  errores: number
}

export type Direccion = 'sube' | 'baja' | 'igual' | 'nuevo'

export interface Tendencia {
  /** Variación porcentual, entera. */
  pct: number
  direccion: Direccion
}

/**
 * Cómo cambió la actividad de una semana a la anterior.
 *
 * Sin semana anterior devuelve `nuevo` en vez de dividir entre cero: un
 * laboratorio que empieza no creció un infinito por ciento, simplemente
 * empezó.
 */
export function tendencia(actual: number, previo: number): Tendencia {
  if (previo === 0) {
    return actual === 0 ? { pct: 0, direccion: 'igual' } : { pct: 0, direccion: 'nuevo' }
  }
  const pct = Math.round(((actual - previo) / previo) * 100)
  return { pct, direccion: pct > 0 ? 'sube' : pct < 0 ? 'baja' : 'igual' }
}

/**
 * Días desde el último trabajo. `null` si nunca hubo ninguno.
 *
 * `null` y no cero a propósito: un laboratorio que nunca registró nada no está
 * «al día», es el que más atención necesita —se le dio de alta y no arrancó.
 */
export function diasSinActividad(ultimo: string | null, hoy: string): number | null {
  return ultimo === null ? null : diasEntre(ultimo, hoy)
}

export const ESTADOS_ACTIVIDAD = ['sin_arrancar', 'dormido', 'bajando', 'activo'] as const
export type EstadoActividad = (typeof ESTADOS_ACTIVIDAD)[number]

export const ETIQUETA_ACTIVIDAD: Record<EstadoActividad, string> = {
  sin_arrancar: 'Sin arrancar',
  dormido: 'Dormido',
  bajando: 'Bajando',
  activo: 'Activo',
}

/** Caída a partir de la cual se considera que algo va mal, no ruido normal. */
const CAIDA_PREOCUPANTE = -40

/** Días sin registrar nada tras los cuales se considera dormido. */
const DIAS_PARA_DORMIDO = 14

/**
 * En qué situación está un laboratorio.
 *
 * El orden de las comprobaciones importa: primero el que nunca arrancó, que es
 * un problema de puesta en marcha y no de fuga; después el dormido; y solo
 * entonces la caída, que es el aviso temprano y el único que todavía se puede
 * revertir con una llamada.
 */
export function estadoDeActividad(m: MetricaDeLaboratorio, hoy: string): EstadoActividad {
  if (m.trabajos_total === 0) return 'sin_arrancar'

  const dias = diasSinActividad(m.ultimo_trabajo, hoy)
  if (dias !== null && dias >= DIAS_PARA_DORMIDO) return 'dormido'

  const t = tendencia(m.trabajos_7, m.trabajos_previos_7)
  if (t.direccion === 'baja' && t.pct <= CAIDA_PREOCUPANTE) return 'bajando'

  return 'activo'
}

export interface ResumenDelNegocio {
  total: number
  dePago: number
  deCortesia: number
  suspendidos: number
  /** Ingreso mensual comprometido, con los anuales prorrateados. */
  ingresoMensual: number
  trabajosDelMes: number
  /** Cuántos no están «activos»: hay que llamarlos. */
  necesitanAtencion: number
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Las cifras del negocio entero.
 *
 * El ingreso solo cuenta los laboratorios **de pago y activos**: un suspendido
 * no va a pagar este mes, y sumar su cuota sería mirar el negocio con dinero
 * que no existe. Los anuales se dividen entre doce para poder sumarlos con los
 * mensuales; sin eso, un cliente de S/2.400 al año aparecería como S/2.400 al
 * mes.
 */
export function resumenDelNegocio(
  labs: readonly MetricaDeLaboratorio[],
  hoy: string,
): ResumenDelNegocio {
  let dePago = 0
  let deCortesia = 0
  let suspendidos = 0
  let ingreso = 0
  let trabajos = 0
  let atencion = 0

  for (const l of labs) {
    trabajos += l.trabajos_mes
    if (l.estado !== 'activo') suspendidos++
    if (l.plan === 'gratis') deCortesia++
    else {
      dePago++
      if (l.estado === 'activo') {
        const cuota = l.precio_cuota ?? 0
        ingreso += l.periodicidad === 'anual' ? cuota / 12 : cuota
      }
    }
    if (estadoDeActividad(l, hoy) !== 'activo') atencion++
  }

  return {
    total: labs.length,
    dePago,
    deCortesia,
    suspendidos,
    ingresoMensual: r2(ingreso),
    trabajosDelMes: trabajos,
    necesitanAtencion: atencion,
  }
}
