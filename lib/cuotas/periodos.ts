/**
 * Aritmética de los periodos de cobro.
 *
 * Los periodos se ancoran al **día de inicio de cobro**, no al mes del
 * calendario: si a un laboratorio se le empieza a cobrar el 15 de septiembre,
 * su primer periodo va del 15/09 al 14/10. Así no hay meses partidos ni
 * cuotas prorrateadas, que es la clase de cálculo que nadie quiere explicarle a
 * un cliente por teléfono.
 *
 * Todo se hace con fechas `YYYY-MM-DD` y aritmética en UTC. Hacerla en la zona
 * local del servidor haría que el resultado cambiara según dónde se ejecute.
 */

export const PERIODICIDADES = ['mensual', 'anual'] as const
export type Periodicidad = (typeof PERIODICIDADES)[number]

export const ETIQUETA_PERIODICIDAD: Record<Periodicidad, string> = {
  mensual: 'Mensual',
  anual: 'Anual',
}

/** Plazo de pago desde la emisión, según los términos del servicio. */
const DIAS_PARA_VENCER = 15

/**
 * Tope de periodos generados de una vez.
 *
 * Es un freno, no un límite del negocio: una fecha de inicio mal escrita
 * —2016 en vez de 2026— generaría cien cuotas de golpe y habría que borrarlas
 * a mano.
 */
const MAXIMO_POR_VEZ = 36

function partes(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number)
  return [y ?? 1970, m ?? 1, d ?? 1]
}

function aIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function diasDelMes(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/**
 * Suma meses recortando al último día del mes cuando el día no existe.
 *
 * El 31 de enero más un mes es el 28 de febrero, no el 3 de marzo. Sin el
 * recorte, la aritmética se desborda al mes siguiente y los periodos de un
 * laboratorio que empezó un día 31 se irían corriendo solos.
 */
export function sumarMeses(iso: string, meses: number): string {
  const [y, m, d] = partes(iso)
  const total = (y * 12 + (m - 1)) + meses
  const anio = Math.floor(total / 12)
  const mes = (total % 12) + 1
  return aIso(anio, mes, Math.min(d, diasDelMes(anio, mes)))
}

/** Suma días. */
export function sumarDias(iso: string, dias: number): string {
  const [y, m, d] = partes(iso)
  const t = Date.UTC(y, m - 1, d) + dias * 86_400_000
  const f = new Date(t)
  return aIso(f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate())
}

/** Diferencia en días entre dos fechas (b - a). */
export function diasEntre(a: string, b: string): number {
  const [ay, am, ad] = partes(a)
  const [by, bm, bd] = partes(b)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

/** El último día que cubre un periodo que empieza en `inicio`. */
export function finDePeriodo(inicio: string, periodicidad: Periodicidad): string {
  return sumarDias(sumarMeses(inicio, periodicidad === 'anual' ? 12 : 1), -1)
}

/** Cuándo vence una cuota emitida en esa fecha. */
export function vencimientoDe(emision: string): string {
  return sumarDias(emision, DIAS_PARA_VENCER)
}

export interface PeriodoACobrar {
  periodo_inicio: string
  periodo_fin: string
  vence_el: string
}

/**
 * Los periodos que deberían existir y todavía no están.
 *
 * Solo devuelve periodos **ya empezados**: emitir el de octubre en septiembre
 * sería cobrar por adelantado algo que el cliente aún puede cancelar.
 *
 * `yaGenerados` son las fechas de inicio de las cuotas que ya existen. Eso hace
 * segura la generación al abrir el panel: si la pantalla se renderiza dos
 * veces, la segunda no encuentra nada que generar. La base lo refuerza con un
 * índice único por laboratorio y periodo.
 */
export function periodosFaltantes(
  inicioCobro: string | null,
  periodicidad: Periodicidad,
  hoy: string,
  yaGenerados: readonly string[],
): PeriodoACobrar[] {
  if (!inicioCobro) return []

  const existentes = new Set(yaGenerados)
  const periodos: PeriodoACobrar[] = []
  let inicio = inicioCobro

  while (inicio <= hoy && periodos.length < MAXIMO_POR_VEZ) {
    if (!existentes.has(inicio)) {
      periodos.push({
        periodo_inicio: inicio,
        periodo_fin: finDePeriodo(inicio, periodicidad),
        vence_el: vencimientoDe(inicio),
      })
    }
    inicio = sumarMeses(inicio, periodicidad === 'anual' ? 12 : 1)
  }

  return periodos
}

/** Días transcurridos desde el vencimiento. Cero si aún no vence. */
export function diasDeMora(venceEl: string, hoy: string): number {
  return Math.max(0, diasEntre(venceEl, hoy))
}
