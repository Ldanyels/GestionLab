import { z } from 'zod'
import { sumarDias } from '@/lib/fechas'

/**
 * Plazos de entrega.
 *
 * El problema que resuelve: en el piloto, 46 de 47 trabajos no tenían fecha de
 * entrega. No porque no importe —es el dato más importante de un laboratorio—
 * sino porque el formulario pedía una **fecha de calendario** y un laboratorio
 * no piensa en fechas, piensa en días: «acrílico, tres días». Ese desajuste
 * bastó para que el campo quedara vacío y para que la pantalla Hoy no pudiera
 * contestar qué hay que entregar.
 *
 * Aquí está la aritmética y las reglas; la pantalla solo las muestra.
 */

/** Tope de días de plazo. Un año es ya un error de tecleo, no un plazo. */
const MAXIMO_DIAS = 365

/**
 * Los días de plazo de un tipo de trabajo, tal como llegan del formulario.
 *
 * Vacío es **sin plazo**, no cero: son cosas distintas. Cero días significa
 * «se entrega el mismo día» y es un plazo legítimo para un ajuste rápido;
 * vacío significa que ese tipo no tiene plazo definido y no se sugiere fecha.
 */
export const diasDePlazoSchema = z
  .preprocess(
    // El campo ausente cuenta como vacío: si un formulario nuevo se olvida de
    // enviarlo, el tipo nace sin plazo, que es lo razonable. Un error de
    // validación ahí sería un fallo que el usuario no puede corregir.
    (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim()),
    z.union([
      z.null(),
      z.string().regex(/^\d+$/, 'Los días de entrega deben ser un número entero'),
    ]),
  )
  .transform((v) => (v === null ? null : Number(v)))
  .refine(
    (v) => v === null || (v >= 0 && v <= MAXIMO_DIAS),
    `Los días de entrega deben estar entre 0 y ${MAXIMO_DIAS}`,
  )

/**
 * La fecha de entrega que corresponde a un ingreso y un plazo.
 *
 * Devuelve `null` cuando el tipo no tiene plazo. No se inventa uno por defecto:
 * el laboratorio confiaría en una promesa que nadie hizo.
 */
export function fechaSugerida(
  fechaIngreso: string,
  diasEntrega: number | null | undefined,
): string | null {
  if (diasEntrega === null || diasEntrega === undefined) return null
  return sumarDias(fechaIngreso, diasEntrega)
}

/**
 * Atajos para poner la fecha con un toque.
 *
 * Cuentan desde el **ingreso** y no desde hoy: al corregir la fecha de un
 * trabajo que entró el lunes, «3 días» debe seguir siendo el jueves, no tres
 * días desde el momento en que alguien lo está editando.
 */
export const ATAJOS_DE_PLAZO = [
  { etiqueta: 'Mañana', dias: 1 },
  { etiqueta: '3 días', dias: 3 },
  { etiqueta: '1 semana', dias: 7 },
] as const

export type EstadoDeEntrega = 'entregada' | 'atrasada' | 'hoy' | 'proxima' | 'sin_fecha'

interface ConEntrega {
  fecha_entrega: string | null
  estado: string
}

/**
 * En qué situación está la entrega de un trabajo.
 *
 * Lo ya entregado nunca está atrasado, aunque su fecha haya pasado. Sin esa
 * regla, el día que se les pongan fechas a los trabajos viejos aparecerían
 * todos en rojo y el aviso dejaría de significar nada.
 */
export function estadoDeEntrega(t: ConEntrega, hoy: string): EstadoDeEntrega {
  if (t.estado === 'entregado' || t.estado === 'cerrado') return 'entregada'
  if (!t.fecha_entrega) return 'sin_fecha'
  if (t.fecha_entrega < hoy) return 'atrasada'
  if (t.fecha_entrega === hoy) return 'hoy'
  return 'proxima'
}

/**
 * Lo que hay que entregar ya: lo atrasado y lo de hoy.
 *
 * Lo atrasado primero, y entre atrasados el más viejo arriba, que es el que
 * lleva más tiempo esperando y por el que va a llamar el consultorio.
 */
export function porEntregar<T extends ConEntrega>(trabajos: readonly T[], hoy: string): T[] {
  return trabajos
    .filter((t) => {
      const e = estadoDeEntrega(t, hoy)
      return e === 'atrasada' || e === 'hoy'
    })
    .sort((a, b) => (a.fecha_entrega ?? '').localeCompare(b.fecha_entrega ?? ''))
}

/**
 * Ordena por fecha de entrega, con los sin fecha al final.
 *
 * Los null van al final explícitamente. Comparados como cadena vacía se
 * colarían arriba de todo y taparían justo lo que urge.
 */
export function ordenarPorEntrega<T extends { fecha_entrega: string | null }>(
  trabajos: readonly T[],
): T[] {
  return [...trabajos].sort((a, b) => {
    if (a.fecha_entrega === b.fecha_entrega) return 0
    if (!a.fecha_entrega) return 1
    if (!b.fecha_entrega) return -1
    return a.fecha_entrega.localeCompare(b.fecha_entrega)
  })
}

/**
 * El plazo de un trabajo con varias líneas: el más largo de sus tipos.
 *
 * Un trabajo con una corona de 3 días y una prótesis de 10 no está listo en 3:
 * no está listo hasta que lo esté la pieza más lenta. Tomar el más corto —o un
 * promedio— haría que el sistema prometiera al consultorio una fecha que el
 * laboratorio no puede cumplir, y eso es peor que no prometer nada.
 *
 * Los tipos sin plazo no cuentan, pero tampoco anulan a los que sí lo tienen.
 */
export function plazoDelTrabajo(
  tipos: readonly { dias_entrega: number | null }[],
): number | null {
  const definidos = tipos
    .map((t) => t.dias_entrega)
    .filter((d): d is number => d !== null && d !== undefined)
  return definidos.length === 0 ? null : Math.max(...definidos)
}
