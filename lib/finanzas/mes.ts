import { diasDelMes } from '@/lib/fechas'
import { hoyLima } from '@/lib/trabajos/agenda'

/**
 * Rango del mes en curso **en Lima**.
 *
 * Antes salía de `new Date()` con la zona del servidor, y el servidor es
 * Vercel: UTC. Lima va cinco horas por detrás, así que desde las 19:00 del
 * último día del mes el sistema pasaba al mes siguiente —Finanzas, Gastos y el
 * periodo por defecto de Reportes empezaban a enseñar octubre la tarde del 30
 * de septiembre—. En el portátil del laboratorio no se veía: ahí la zona del
 * sistema ya es la de Perú.
 *
 * Es el mismo fallo que el de `current_date` en la base, y se arregla igual:
 * la fecha se resuelve en Lima y nunca se saca del reloj de la máquina.
 *
 * Vive aparte de `lib/finanzas/data.ts` porque es una función pura de fechas y
 * ese módulo abre una conexión a Supabase con `next/headers`. Mientras estuvo
 * ahí, cualquier componente de cliente que necesitara el mes arrastraba código
 * de servidor al navegador y la compilación fallaba.
 *
 * @param hoy El día de referencia (`YYYY-MM-DD`). Se inyecta en las pruebas.
 */
export function rangoMesActual(hoy: string = hoyLima()): { desde: string; hasta: string } {
  const [anio, mes] = hoy.split('-').map(Number)
  const mm = String(mes).padStart(2, '0')
  return {
    desde: `${anio}-${mm}-01`,
    hasta: `${anio}-${mm}-${String(diasDelMes(anio!, mes!)).padStart(2, '0')}`,
  }
}

/**
 * Rango del mes anterior al del día dado, en Lima.
 *
 * El laboratorio cierra cuentas cuando el mes ya terminó: los recibos de luz y
 * agua llegan en los primeros días del siguiente, y los pagos al personal se
 * cuadran después. Sin esta vista, cada 1 de mes el trabajo del mes recién
 * cerrado desaparecía de pantalla.
 */
export function rangoMesAnterior(hoy: string = hoyLima()): { desde: string; hasta: string } {
  const [anio, mes] = hoy.split('-').map(Number)
  const a = mes === 1 ? anio! - 1 : anio!
  const m = mes === 1 ? 12 : mes! - 1
  const mm = String(m).padStart(2, '0')
  return {
    desde: `${a}-${mm}-01`,
    hasta: `${a}-${mm}-${String(diasDelMes(a, m)).padStart(2, '0')}`,
  }
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'setiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/**
 * «setiembre 2026» a partir de una fecha ISO.
 *
 * Con setiembre a la peruana, que es como lo escribe el laboratorio.
 */
export function etiquetaDeMes(iso: string): string {
  const [anio, mes] = iso.split('-').map(Number)
  return `${MESES[(mes ?? 1) - 1]} ${anio}`
}
