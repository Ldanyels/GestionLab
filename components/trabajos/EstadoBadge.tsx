import { ETIQUETA_TRABAJO, type EstadoTrabajo } from '@/lib/trabajos/estado'

const estilos: Record<EstadoTrabajo, string> = {
  en_curso: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
  cerrado: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  entregado: 'bg-[var(--color-muted)]/15 text-[var(--color-muted)]',
}

export function EstadoBadge({ estado }: { estado: EstadoTrabajo }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${estilos[estado]}`}
    >
      {ETIQUETA_TRABAJO[estado]}
    </span>
  )
}
