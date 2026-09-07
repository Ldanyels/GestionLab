import type { CatalogoTrabajo } from './types'

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Filtra tipos de trabajo por texto libre: ignora mayúsculas y tildes,
 * busca en nombre y categoría, y exige que coincidan todas las palabras.
 */
export function filtrarTipos<
  T extends Pick<CatalogoTrabajo, 'nombre' | 'categoria'>,
>(tipos: readonly T[], q: string): T[] {
  const tokens = normalizar(q.trim()).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return [...tipos]
  return tipos.filter((t) => {
    const texto = normalizar(`${t.categoria} ${t.nombre}`)
    return tokens.every((tok) => texto.includes(tok))
  })
}
