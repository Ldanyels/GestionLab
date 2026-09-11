/**
 * Las tres categorías de gasto y sus conceptos frecuentes.
 *
 * Tres y no más: suficientes para saber a dónde se va el dinero sin obligar a
 * nadie a clasificar con precisión contable. Una lista larga de categorías
 * termina con todo dentro de «Otros».
 */

export const CATEGORIAS_GASTO = ['servicio', 'equipo', 'otro'] as const
export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number]

export const ETIQUETA_CATEGORIA: Record<CategoriaGasto, string> = {
  servicio: 'Servicios',
  equipo: 'Equipo',
  otro: 'Otros',
}

/** Qué cabe en cada categoría, para que nadie tenga que adivinarlo. */
export const AYUDA_CATEGORIA: Record<CategoriaGasto, string> = {
  servicio: 'Lo que llega todos los meses: luz, agua, internet, alquiler.',
  equipo: 'Compras y reparaciones del laboratorio.',
  otro: 'Todo lo demás.',
}

/**
 * Conceptos de un toque.
 *
 * Son atajos que llenan el campo, no una lista cerrada: el concepto se puede
 * escribir libremente. Existen porque la luz y el agua se registran doce veces
 * al año cada una, y teclearlas doce veces es la clase de fricción que hace que
 * el gasto no se registre.
 */
export const CONCEPTOS_FRECUENTES: Record<CategoriaGasto, readonly string[]> = {
  servicio: ['Luz', 'Agua', 'Internet', 'Alquiler', 'Teléfono'],
  equipo: ['Reparación', 'Compra de equipo', 'Repuestos'],
  otro: [],
}

export function esCategoriaGasto(v: string): v is CategoriaGasto {
  return (CATEGORIAS_GASTO as readonly string[]).includes(v)
}
