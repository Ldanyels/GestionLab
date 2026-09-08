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

/** Lo que un trabajo necesita tener para poder repartir la jornada. */
interface EntregaConEstado {
  fecha_entrega: string | null
  estado: string
}

/** Entregas del día que siguen abiertas: lo que queda por hacer. */
export function pendientesDelDia<T extends EntregaConEstado>(
  trabajos: readonly T[],
  dia: string,
): T[] {
  return entregasDelDia(trabajos, dia).filter((t) => t.estado === 'en_curso')
}

/**
 * Entregas del día que ya están hechas: la producción de la jornada.
 *
 * Existe porque la pantalla Hoy alimentaba la agenda solo con los trabajos en
 * curso, así que un trabajo desaparecía de la vista en el instante en que se
 * marcaba cerrado o entregado. El técnico no tenía dónde ver lo que había hecho
 * en el día, aunque el contador de "Entregas de hoy" siguiera incluyéndolo.
 *
 * Ojo con lo que significa: `trabajo` no guarda cuándo se terminó, solo su
 * fecha de entrega. Esto devuelve "entregas de hoy ya hechas", no "terminado
 * hoy"; un trabajo con entrega de ayer que se cierra hoy no aparece. Para eso
 * haría falta una columna `fecha_cierre` en la tabla.
 */
export function realizadosDelDia<T extends EntregaConEstado>(
  trabajos: readonly T[],
  dia: string,
): T[] {
  return entregasDelDia(trabajos, dia).filter(
    (t) => t.estado === 'cerrado' || t.estado === 'entregado',
  )
}
