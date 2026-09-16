import { sumarDias } from '@/lib/fechas'

/**
 * Detección de trabajos posiblemente duplicados.
 *
 * El problema: un técnico registra un trabajo hoy y mañana otro registra el
 * mismo. Queda información falsa en el sistema y, peor, se le cobra dos veces
 * al consultorio.
 *
 * Tres validaciones a la vez —**consultorio, paciente y tipo de trabajo**— en
 * una ventana de cinco días. Las tres, porque cualquiera por separado produce
 * avisos constantes: un consultorio encarga decenas de trabajos al mes y un
 * mismo tipo se repite todo el tiempo.
 *
 * **Avisa, no impide.** En los datos reales había cuatro pares de trabajos
 * repetidos del mismo consultorio y tipo, y los cuatro eran encargos legítimos.
 * Un bloqueo los habría rechazado. Quien registra es quien sabe si es el mismo
 * trabajo o no; el sistema solo se asegura de que lo mire.
 */

/** Días hacia atrás que se revisan. */
export const DIAS_DE_VENTANA = 5

/** Lo mínimo que hace falta de un trabajo para compararlo con otro. */
export interface TrabajoComparable {
  consultorio_id: string
  paciente_nombre: string | null
  /** Ids de los tipos del catálogo que lleva el trabajo. */
  tipos: readonly string[]
}

/**
 * El nombre del paciente en su forma comparable.
 *
 * Sin tildes, sin mayúsculas y sin espacios de sobra: dos técnicos distintos
 * casi nunca escriben un nombre exactamente igual, y sin normalizar el filtro
 * no detectaría nada.
 *
 * Devuelve `null` cuando no hay nombre, y eso es deliberado: dos trabajos sin
 * paciente **no** son «el mismo paciente». En los datos reales, los cuatro
 * pares repetidos sin nombre eran encargos legítimos del consultorio, y
 * tratarlos como coincidencia llenaría la pantalla de avisos falsos —que es
 * como se consigue que nadie los lea.
 */
export function normalizarPaciente(nombre: string | null | undefined): string | null {
  if (!nombre) return null
  const limpio = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  return limpio === '' ? null : limpio
}

/**
 * ¿Los dos trabajos cumplen las tres validaciones?
 *
 * Basta con que compartan **un** tipo: un trabajo de «corona + perno» y otro de
 * «corona» para el mismo paciente del mismo consultorio en cinco días son lo
 * bastante parecidos como para preguntar. Exigir listas idénticas dejaría pasar
 * el duplicado parcial, que es el más fácil de cometer.
 */
export function hayCoincidencia(a: TrabajoComparable, b: TrabajoComparable): boolean {
  if (a.consultorio_id !== b.consultorio_id) return false

  const pacienteA = normalizarPaciente(a.paciente_nombre)
  const pacienteB = normalizarPaciente(b.paciente_nombre)
  if (pacienteA === null || pacienteB === null || pacienteA !== pacienteB) return false

  const tipos = new Set(a.tipos)
  return b.tipos.some((t) => tipos.has(t))
}

/** Desde qué fecha se revisa, contando hacia atrás desde el ingreso. */
export function desdeQueFecha(fechaIngreso: string): string {
  return sumarDias(fechaIngreso, -DIAS_DE_VENTANA)
}
