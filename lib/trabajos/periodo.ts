/**
 * Filtro por fecha de la lista de Trabajos.
 *
 * Nunca filtra por `fecha_entrega`, que es la fecha **prometida**: llega en
 * NULL en todos los trabajos de MasterLab porque nadie la llena, así que un
 * filtro sobre ella devolvería siempre cero resultados.
 *
 * Filtra por `fecha_ingreso` —que la pone la base sola con
 * `default current_date`— salvo cuando se están viendo los entregados, donde
 * pasa a `entregado_el`, la fecha real de salida. Ese acoplamiento al estado
 * evita las combinaciones sin sentido: un trabajo en curso no tiene fecha de
 * entrega, así que «en curso en los últimos 7 días por fecha de entrega» sería
 * siempre una lista vacía.
 */
import type { EstadoTrabajo } from './estado'

export const PERIODOS = ['todo', 'hoy', '7d', '30d', 'rango'] as const
export type Periodo = (typeof PERIODOS)[number]

export const ETIQUETA_PERIODO: Record<Periodo, string> = {
  todo: 'Todo',
  hoy: 'Hoy',
  '7d': '7 días',
  '30d': '30 días',
  rango: 'Rango…',
}

export interface Rango {
  desde: string
  hasta: string
}

/**
 * Resta días a una fecha ISO.
 *
 * La aritmética va en UTC a propósito: hacerla en la zona local del servidor
 * haría que el resultado cambiara según dónde se ejecute.
 */
export function restarDias(iso: string, dias: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const t = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) - dias * 86_400_000
  const f = new Date(t)
  const mm = String(f.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(f.getUTCDate()).padStart(2, '0')
  return `${f.getUTCFullYear()}-${mm}-${dd}`
}

/** Valida el parámetro de la URL. Cualquier cosa desconocida cae en 'todo'. */
export function resolverPeriodo(valor: string | undefined): Periodo {
  return (PERIODOS as readonly string[]).includes(valor ?? '') ? (valor as Periodo) : 'todo'
}

/**
 * Rango de fechas que corresponde al periodo, o `null` si no hay que acotar.
 *
 * Con `rango` y ninguna fecha devuelve `null` en vez de un rango imposible: si
 * el usuario despliega el rango y aún no elige nada, debe seguir viendo la
 * lista completa, no una pantalla vacía.
 */
export function rangoDePeriodo(
  periodo: Periodo,
  hoy: string,
  desde?: string,
  hasta?: string,
): Rango | null {
  switch (periodo) {
    case 'hoy':
      return { desde: hoy, hasta: hoy }
    case '7d':
      return { desde: restarDias(hoy, 6), hasta: hoy }
    case '30d':
      return { desde: restarDias(hoy, 29), hasta: hoy }
    case 'rango': {
      if (!desde && !hasta) return null
      // Un extremo suelto acota solo por ese lado. Si vienen al revés se
      // enderezan: es más útil que devolver una lista vacía.
      const a = desde || '0000-01-01'
      const b = hasta || '9999-12-31'
      return a <= b ? { desde: a, hasta: b } : { desde: b, hasta: a }
    }
    default:
      return null
  }
}

/** Las dos fechas por las que se puede acotar la lista. */
export type CampoFecha = 'fecha_ingreso' | 'entregado_el'

export const ETIQUETA_CAMPO_FECHA: Record<CampoFecha, string> = {
  fecha_ingreso: 'Ingreso',
  entregado_el: 'Entrega',
}

/** Qué fecha tiene sentido acotar según el estado que se esté viendo. */
export function campoFechaDe(estado: EstadoTrabajo | null | undefined): CampoFecha {
  return estado === 'entregado' ? 'entregado_el' : 'fecha_ingreso'
}

type ConFechas = { fecha_ingreso: string; entregado_el?: string | null }

/**
 * Trabajos cuya fecha cae dentro del rango, extremos incluidos.
 *
 * Los que no tienen fecha en el campo pedido quedan fuera del rango, no
 * dentro: son los entregados de antes de que se registrara la fecha real, y
 * colarlos en cualquier periodo sería afirmar algo que no consta.
 */
export function filtrarPorFecha<T extends ConFechas>(
  lista: readonly T[],
  rango: Rango | null,
  campo: CampoFecha = 'fecha_ingreso',
): T[] {
  if (!rango) return [...lista]
  return lista.filter((t) => {
    const fecha = t[campo]
    return Boolean(fecha) && fecha! >= rango.desde && fecha! <= rango.hasta
  })
}
