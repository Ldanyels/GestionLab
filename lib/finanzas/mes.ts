/**
 * Rango del mes en curso, en fechas locales.
 *
 * Vive aparte de `lib/finanzas/data.ts` porque es una función pura de fechas y
 * ese módulo abre una conexión a Supabase con `next/headers`. Mientras estuvo
 * ahí, cualquier componente de cliente que necesitara el mes arrastraba código
 * de servidor al navegador y la compilación fallaba.
 */
function fmtFecha(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/** Rango [desde, hasta] del mes actual (fechas locales YYYY-MM-DD). */
export function rangoMesActual(): { desde: string; hasta: string } {
  const now = new Date()
  const desde = new Date(now.getFullYear(), now.getMonth(), 1)
  const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { desde: fmtFecha(desde), hasta: fmtFecha(hasta) }
}
