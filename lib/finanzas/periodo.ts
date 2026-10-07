import { fechaValida } from '@/lib/trabajos/periodo'
import { hoyLima } from '@/lib/trabajos/agenda'
import { etiquetaDeMes, rangoMesActual, rangoMesAnterior } from './mes'

/**
 * Periodos de Finanzas.
 *
 * Son menos que los de Trabajos a propósito. Aquí no se pregunta «qué pasó hoy»
 * —eso es la pantalla Hoy— sino cómo fue un mes cerrado: la luz, el agua y los
 * pagos al personal se cuadran cuando el mes ya terminó.
 */
export const PERIODOS_FINANZAS = ['mes', 'mes_anterior', 'rango'] as const
export type PeriodoFinanzas = (typeof PERIODOS_FINANZAS)[number]

export const ETIQUETA_PERIODO_FINANZAS: Record<PeriodoFinanzas, string> = {
  mes: 'Este mes',
  mes_anterior: 'Mes anterior',
  rango: 'Rango…',
}

export interface ParamsFinanzas {
  periodo?: string
  desde?: string
  hasta?: string
}

export interface PeriodoResuelto {
  periodo: PeriodoFinanzas
  desde: string
  hasta: string
  /** Para el encabezado: «setiembre 2026» o «01/09/2026 – 15/09/2026». */
  etiqueta: string
}

/** Cualquier valor desconocido en la URL cae en el mes en curso. */
export function resolverPeriodoFinanzas(valor: string | undefined): PeriodoFinanzas {
  return (PERIODOS_FINANZAS as readonly string[]).includes(valor ?? '')
    ? (valor as PeriodoFinanzas)
    : 'mes'
}

function dmy(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/**
 * Normaliza los parámetros de la URL en un rango de fechas.
 *
 * Las dos fechas de un rango a medida se validan **antes** de usarse: de aquí
 * pasan a construir filtros que viajan a la base como texto, y un valor con
 * paréntesis o comas se cuela dentro de la expresión y la altera. Es la misma
 * puerta que cierra `fechaValida` en Trabajos, y por eso se reutiliza en vez de
 * repetir la comprobación.
 *
 * Un rango incompleto o al revés cae al mes en curso en vez de quedarse sin
 * límites: una pantalla de dinero en blanco no dice que el filtro esté mal, y
 * se leería como que no hubo movimientos.
 */
export function resolverPeriodo(
  sp: ParamsFinanzas,
  hoy: string = hoyLima(),
): PeriodoResuelto {
  // Unas fechas sueltas sin periodo son un rango a medida: así funcionan los
  // enlaces que alguien guarde en favoritos.
  const periodo = sp.periodo
    ? resolverPeriodoFinanzas(sp.periodo)
    : sp.desde || sp.hasta
      ? 'rango'
      : 'mes'

  if (periodo === 'rango') {
    const desde = fechaValida(sp.desde)
    const hasta = fechaValida(sp.hasta)
    if (desde && hasta && desde <= hasta) {
      return { periodo, desde, hasta, etiqueta: `${dmy(desde)} – ${dmy(hasta)}` }
    }
    const mes = rangoMesActual(hoy)
    return { periodo: 'mes', ...mes, etiqueta: etiquetaDeMes(mes.desde) }
  }

  const rango = periodo === 'mes_anterior' ? rangoMesAnterior(hoy) : rangoMesActual(hoy)
  return { periodo, ...rango, etiqueta: etiquetaDeMes(rango.desde) }
}

/**
 * El periodo vigente como cadena de consulta, para no perderlo al navegar.
 *
 * Mirando setiembre y pulsando «Gastos», lo que se quiere ver son los gastos de
 * setiembre. Sin esto, cada salto devolvía al mes en curso y había que volver a
 * elegir.
 */
export function consultaDePeriodo(p: PeriodoResuelto): string {
  return p.periodo === 'rango'
    ? `?periodo=rango&desde=${p.desde}&hasta=${p.hasta}`
    : `?periodo=${p.periodo}`
}
