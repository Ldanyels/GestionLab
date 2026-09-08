/** Fecha de hoy en Perú (YYYY-MM-DD), estable sin importar la zona del servidor. */
export function hoyLima(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
}

/** "Martes 8 de setiembre" — encabezado de la pantalla Hoy. */
export function fechaLarga(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const texto = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(new Date(y, (m ?? 1) - 1, d))
    .replace(',', '')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Trabajos cuya entrega cae exactamente en el día dado.
 * Los sin fecha, atrasados y futuros quedan fuera: la pantalla Hoy
 * muestra solo el día actual.
 */
export function entregasDelDia<T extends { fecha_entrega: string | null }>(
  trabajos: readonly T[],
  dia: string,
): T[] {
  return trabajos.filter((t) => t.fecha_entrega === dia)
}
