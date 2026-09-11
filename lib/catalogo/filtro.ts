import { coincideConTodas } from '@/lib/busqueda'
import type { CatalogoTrabajo } from './types'

/**
 * Filtra tipos de trabajo por texto libre: ignora mayúsculas y tildes,
 * busca en nombre y categoría, y exige que coincidan todas las palabras.
 */
export function filtrarTipos<
  T extends Pick<CatalogoTrabajo, 'nombre' | 'categoria'>,
>(tipos: readonly T[], q: string): T[] {
  return tipos.filter((t) => coincideConTodas(`${t.categoria} ${t.nombre}`, q))
}
