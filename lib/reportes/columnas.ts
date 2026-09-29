import { formatMoney } from '@/lib/format'
import { ETIQUETA_TRABAJO, type EstadoTrabajo } from '@/lib/trabajos/estado'
import { saldoFila, type FilaReporte } from './agrupar'

/** Ancho útil de un A4 apaisado con márgenes de 40 pt. */
export const UTIL_APAISADO = 841.89 - 80

export interface Columna {
  clave: string
  titulo: string
  /** Puntos. La suma no debe pasar de `UTIL_APAISADO`. */
  ancho: number
  /** Las cifras se alinean a la derecha para poder compararlas de un vistazo. */
  derecha?: boolean
}

/*
  El reporte va apaisado porque es una matriz.

  En vertical caben unos 515 pt y el nombre de un consultorio se cortaría en la
  tercera letra. Apaisado hay 762 y las columnas caben enteras, que es la
  diferencia entre una tabla que se lee y una que hay que adivinar.

  El orden y la lista los fijó el laboratorio: no hay columna de ingreso ni de
  estado, y el saldo se lee restando el abono del total.
*/
const CON_MONTOS: Columna[] = [
  { clave: 'consultorio', titulo: 'Consultorio', ancho: 120 },
  { clave: 'doctor', titulo: 'Doctor', ancho: 110 },
  { clave: 'entrega', titulo: 'Entrega', ancho: 70 },
  { clave: 'paciente', titulo: 'Paciente', ancho: 120 },
  { clave: 'abono', titulo: 'Abono', ancho: 75, derecha: true },
  { clave: 'tratamientos', titulo: 'Tratamientos', ancho: 191 },
  { clave: 'total', titulo: 'Total', ancho: 75, derecha: true },
]

/*
  Sin importes —un técnico— sobran las dos columnas de dinero y el espacio se
  reparte entre los nombres, que es lo que ese lector viene a mirar.
*/
const SIN_MONTOS: Columna[] = [
  { clave: 'consultorio', titulo: 'Consultorio', ancho: 150 },
  { clave: 'doctor', titulo: 'Doctor', ancho: 140 },
  { clave: 'entrega', titulo: 'Entrega', ancho: 80 },
  { clave: 'paciente', titulo: 'Paciente', ancho: 150 },
  { clave: 'tratamientos', titulo: 'Tratamientos', ancho: 240 },
]

export function columnasReporte(montos: boolean): Columna[] {
  return montos ? CON_MONTOS : SIN_MONTOS
}

/**
 * La x de cada columna, acumulando anchos desde el margen.
 *
 * Para las de la derecha devuelve el **borde derecho**, que es desde donde se
 * resta el ancho del texto al alinearlo.
 */
export function xDeColumnas(columnas: readonly Columna[], margen: number): number[] {
  const xs: number[] = []
  let x = margen
  for (const c of columnas) {
    xs.push(c.derecha ? x + c.ancho : x)
    x += c.ancho
  }
  return xs
}

/**
 * Las celdas de un trabajo, en el orden de las columnas.
 *
 * Un hueco se escribe «—» y no en blanco: en una matriz impresa, una celda
 * vacía se lee como un error de la exportación, y aquí significa que el dato no
 * existe —un trabajo sin paciente, uno que todavía no salió—.
 */
export function celdasDeFila(f: FilaReporte, columnas: readonly Columna[]): string[] {
  const valores: Record<string, string> = {
    consultorio: f.consultorio,
    doctor: f.doctor,
    entrega: f.entregado_el ?? '—',
    paciente: f.paciente || '—',
    abono: formatMoney(f.pagado),
    tratamientos: f.resumen,
    total: formatMoney(f.total),
  }
  return columnas.map((c) => valores[c.clave] ?? '')
}

/** Si al trabajo le falta cobrar algo. Decide qué se pinta en rojo. */
export function tieneDeuda(f: FilaReporte): boolean {
  return saldoFila(f) > 0.001
}

/**
 * La fila de subtotal de un consultorio: su nombre a la izquierda y sus cifras
 * bajo las columnas que les tocan.
 *
 * El conteo va bajo «Paciente» y no bajo «Doctor» para dejar libre esa columna:
 * al pintarla, el nombre del consultorio puede ocupar las dos y no se corta. En
 * esta fila el nombre es lo que identifica el bloque.
 *
 * Existe porque el reporte se usa para cobrar. Una matriz plana obligaría a
 * sumar a mano lo que debe cada consultorio, que es la única pregunta que se le
 * hace a este papel.
 */
export function celdasDeSubtotal(
  grupo: { consultorio: string; facturado: number; pagado: number },
  cuantos: number,
  columnas: readonly Columna[],
): string[] {
  const valores: Record<string, string> = {
    consultorio: grupo.consultorio,
    paciente: `${cuantos} ${cuantos === 1 ? 'trabajo' : 'trabajos'}`,
    abono: formatMoney(grupo.pagado),
    total: formatMoney(grupo.facturado),
  }
  return columnas.map((c) => valores[c.clave] ?? '')
}
