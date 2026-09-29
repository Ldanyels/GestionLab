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

  En vertical caben unos 515 pt: con diez columnas tocan a 51, y el nombre de un
  consultorio se corta en la tercera letra. Apaisado hay 762 y las columnas
  caben enteras, que es la diferencia entre una tabla que se lee y una que hay
  que adivinar.
*/
const CON_MONTOS: Columna[] = [
  { clave: 'consultorio', titulo: 'Consultorio', ancho: 95 },
  { clave: 'doctor', titulo: 'Doctor', ancho: 95 },
  { clave: 'paciente', titulo: 'Paciente', ancho: 88 },
  { clave: 'trabajo', titulo: 'Trabajo', ancho: 133 },
  { clave: 'ingreso', titulo: 'Ingreso', ancho: 52 },
  { clave: 'entrega', titulo: 'Entrega', ancho: 52 },
  { clave: 'estado', titulo: 'Estado', ancho: 58 },
  { clave: 'total', titulo: 'Monto', ancho: 62, derecha: true },
  { clave: 'pagado', titulo: 'Pagado', ancho: 62, derecha: true },
  { clave: 'saldo', titulo: 'Saldo', ancho: 62, derecha: true },
]

/*
  Sin importes —un técnico— sobran las tres columnas de dinero y el espacio se
  reparte entre los nombres, que es lo que ese lector viene a mirar.
*/
const SIN_MONTOS: Columna[] = [
  { clave: 'consultorio', titulo: 'Consultorio', ancho: 130 },
  { clave: 'doctor', titulo: 'Doctor', ancho: 130 },
  { clave: 'paciente', titulo: 'Paciente', ancho: 120 },
  { clave: 'trabajo', titulo: 'Trabajo', ancho: 196 },
  { clave: 'ingreso', titulo: 'Ingreso', ancho: 60 },
  { clave: 'entrega', titulo: 'Entrega', ancho: 60 },
  { clave: 'estado', titulo: 'Estado', ancho: 60 },
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
    paciente: f.paciente || '—',
    trabajo: f.resumen,
    ingreso: f.fecha_ingreso,
    entrega: f.entregado_el ?? '—',
    estado: ETIQUETA_TRABAJO[f.estado as EstadoTrabajo] ?? f.estado,
    total: formatMoney(f.total),
    pagado: formatMoney(f.pagado),
    saldo: formatMoney(saldoFila(f)),
  }
  return columnas.map((c) => valores[c.clave] ?? '')
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
  grupo: { consultorio: string; facturado: number; pagado: number; saldo: number },
  cuantos: number,
  columnas: readonly Columna[],
): string[] {
  const valores: Record<string, string> = {
    consultorio: grupo.consultorio,
    paciente: `${cuantos} ${cuantos === 1 ? 'trabajo' : 'trabajos'}`,
    total: formatMoney(grupo.facturado),
    pagado: formatMoney(grupo.pagado),
    saldo: formatMoney(grupo.saldo),
  }
  return columnas.map((c) => valores[c.clave] ?? '')
}
