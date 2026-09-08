/** Resumen legible de las líneas de una cuenta: "2 × Corona + Férula". */
export function resumenItems(
  items: ReadonlyArray<{ cantidad: number; nombre: string }>,
): string {
  if (items.length === 0) return '—'
  return items
    .map((i) => (i.cantidad > 1 ? `${i.cantidad} × ${i.nombre}` : i.nombre))
    .join(' + ')
}
