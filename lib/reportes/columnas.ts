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
  /**
   * Nunca se encoge para hacer sitio a otra.
   *
   * Lo llevan las columnas cuyo contenido tiene un ancho conocido y no admite
   * recorte: una fecha y un importe o están enteros o no dicen nada. El que se
   * aprieta es el texto, que se sigue entendiendo a medias.
   */
  fija?: boolean
}

/*
  El reporte va apaisado porque es una matriz.

  En vertical caben unos 515 pt y el nombre de un consultorio se cortaría en la
  tercera letra. Apaisado hay 762 y las columnas caben enteras, que es la
  diferencia entre una tabla que se lee y una que hay que adivinar.

  El orden y la lista los fijó el laboratorio: no hay columna de ingreso ni de
  estado, y el saldo se lee restando el abono del total. Las dos cifras van
  juntas al final, que es donde se comparan.
*/
const CON_MONTOS: Columna[] = [
  { clave: 'consultorio', titulo: 'Consultorio', ancho: 120 },
  { clave: 'doctor', titulo: 'Doctor', ancho: 110 },
  { clave: 'entrega', titulo: 'Entrega', ancho: 70, fija: true },
  { clave: 'paciente', titulo: 'Paciente', ancho: 120 },
  { clave: 'tratamientos', titulo: 'Tratamientos', ancho: 191 },
  { clave: 'abono', titulo: 'Abono', ancho: 75, derecha: true, fija: true },
  { clave: 'total', titulo: 'Total', ancho: 75, derecha: true, fija: true },
]

/*
  Sin importes —un técnico— sobran las dos columnas de dinero y el espacio se
  reparte entre los nombres, que es lo que ese lector viene a mirar.
*/
const SIN_MONTOS: Columna[] = [
  { clave: 'consultorio', titulo: 'Consultorio', ancho: 150 },
  { clave: 'doctor', titulo: 'Doctor', ancho: 140 },
  { clave: 'entrega', titulo: 'Entrega', ancho: 80, fija: true },
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

/** Lo que se reserva a cada lado del texto dentro de su columna. */
export const RELLENO = 14

/** Ninguna columna baja de aquí: por debajo no cabe ni un dato corto. */
const MINIMO = 46

/**
 * Reparte el ancho disponible según lo que de verdad ocupa el contenido.
 *
 * Los anchos fijos son frágiles: aguantan hasta que alguien da de alta un
 * consultorio con el nombre largo, y entonces el reporte empieza a cortar
 * nombres sin que nadie lo note. Aquí cada columna pide lo que mide su texto
 * más ancho —incluida su cabecera— y se reparte:
 *
 * - Si todo cabe, el sobrante engorda las columnas de texto, que son las que
 *   pueden crecer; así la tabla llena el papel en vez de dejar un hueco.
 * - Si no cabe, se encogen **solo** las de texto y en proporción a lo que
 *   piden, nunca por debajo del mínimo. Las marcadas como fijas no se tocan:
 *   una fecha a medias («2026-0…») o un importe recortado no dicen nada, y un
 *   nombre a medias sí.
 *
 * Se calcula una vez con todas las filas, no por página, para que la tabla no
 * cambie de forma al pasar de hoja.
 */
export function ajustarAnchos(
  columnas: readonly Columna[],
  filas: readonly (readonly string[])[],
  medir: (texto: string) => number,
  disponible: number,
): Columna[] {
  const pedido = columnas.map((c, i) => {
    const contenido = filas.reduce((max, f) => Math.max(max, medir(f[i] ?? '')), 0)
    return Math.max(medir(c.titulo), contenido) + RELLENO
  })

  // Las fijas se quedan con lo que piden; solo el texto da y recibe.
  const flexible = columnas.map((c) => !c.fija)
  const fijo = pedido.reduce((s, p, i) => (flexible[i] ? s : s + p), 0)
  const textoPedido = pedido.reduce((s, p, i) => (flexible[i] ? s + p : s), 0)
  const paraTexto = disponible - fijo

  if (textoPedido <= 0) return columnas.map((c, i) => ({ ...c, ancho: pedido[i]! }))

  const factor = paraTexto / textoPedido
  return columnas.map((c, i) => ({
    ...c,
    ancho: flexible[i] ? Math.max(MINIMO, Math.floor(pedido[i]! * factor)) : pedido[i]!,
  }))
}
