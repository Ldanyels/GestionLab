/**
 * Altura o ancho de una barra como porcentaje del valor máximo de la serie.
 * Devuelve 0 si el máximo es 0 (serie vacía o todo en cero).
 */
export function proporcion(valor: number, maximo: number): number {
  if (!Number.isFinite(valor) || !Number.isFinite(maximo) || maximo <= 0) return 0
  return Math.round(Math.max(0, Math.min(valor / maximo, 1)) * 1000) / 10
}

const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'set',
  'oct',
  'nov',
  'dic',
]

/** "2026-09" → "set". */
export function etiquetaMes(iso: string): string {
  const mes = Number(iso.slice(5, 7)) - 1
  return MESES[mes] ?? iso
}
