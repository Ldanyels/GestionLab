/**
 * Aritmética de fechas `YYYY-MM-DD`, en UTC.
 *
 * En UTC y no en la zona local del servidor: si el cálculo dependiera de dónde
 * se ejecuta, el mismo trabajo tendría una fecha de entrega distinta según la
 * región de Vercel que atendiera la petición.
 *
 * Vive fuera de cualquier dominio porque la usan dos que no se conocen entre
 * sí: los periodos de cobro y los plazos de entrega.
 */

function partes(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number)
  return [y ?? 1970, m ?? 1, d ?? 1]
}

function aIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Días del mes, contando bisiestos. */
export function diasDelMes(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/** Suma días (o los resta, con un número negativo). */
export function sumarDias(iso: string, dias: number): string {
  const [y, m, d] = partes(iso)
  const f = new Date(Date.UTC(y, m - 1, d) + dias * 86_400_000)
  return aIso(f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate())
}

/**
 * Suma meses recortando al último día del mes cuando el día no existe.
 *
 * El 31 de enero más un mes es el 28 de febrero, no el 3 de marzo. Sin el
 * recorte, la aritmética se desborda al mes siguiente.
 */
export function sumarMeses(iso: string, meses: number): string {
  const [y, m, d] = partes(iso)
  const total = y * 12 + (m - 1) + meses
  const anio = Math.floor(total / 12)
  const mes = (total % 12) + 1
  return aIso(anio, mes, Math.min(d, diasDelMes(anio, mes)))
}

/** Diferencia en días entre dos fechas (b - a). */
export function diasEntre(a: string, b: string): number {
  const [ay, am, ad] = partes(a)
  const [by, bm, bd] = partes(b)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}
