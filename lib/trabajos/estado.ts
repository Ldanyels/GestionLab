export type EstadoTrabajo = 'en_curso' | 'cerrado' | 'entregado'
export type EstadoEtapa = 'pendiente' | 'en_progreso' | 'completada' | 'excluida'

export const ETIQUETA_TRABAJO: Record<EstadoTrabajo, string> = {
  en_curso: 'En curso',
  cerrado: 'Cerrado',
  entregado: 'Entregado',
}

export const ETIQUETA_ETAPA: Record<EstadoEtapa, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
  excluida: 'Excluida',
}

/**
 * Progreso del trabajo: % de etapas completadas sobre las que sí aplican
 * (excluye las marcadas como 'excluida'). Devuelve 0..100 (entero).
 */
export function progresoTrabajo(
  etapas: ReadonlyArray<{ estado: EstadoEtapa }>,
): number {
  const aplicables = etapas.filter((e) => e.estado !== 'excluida')
  if (aplicables.length === 0) return 0
  const completadas = aplicables.filter((e) => e.estado === 'completada').length
  return Math.round((completadas / aplicables.length) * 100)
}

/** Siguiente estado al "avanzar" una etapa (ciclo pendiente→en_progreso→completada). */
export function siguienteEstadoEtapa(actual: EstadoEtapa): EstadoEtapa {
  switch (actual) {
    case 'pendiente':
      return 'en_progreso'
    case 'en_progreso':
      return 'completada'
    default:
      return actual
  }
}
