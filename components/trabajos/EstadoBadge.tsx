import { ETIQUETA_TRABAJO, type EstadoTrabajo } from '@/lib/trabajos/estado'

// Progresión de color: en curso (ámbar) → cerrado (azul) → entregado (verde).
const estilos: Record<EstadoTrabajo, { bg: string; text: string; dot: string }> = {
  en_curso: {
    bg: 'bg-[#d97706]/12',
    text: 'text-[#b45309] dark:text-[#f59e0b]',
    dot: 'bg-[#d97706]',
  },
  cerrado: {
    bg: 'bg-[var(--color-accent)]/12',
    text: 'text-[var(--color-accent)]',
    dot: 'bg-[var(--color-accent)]',
  },
  entregado: {
    bg: 'bg-[var(--color-success)]/12',
    text: 'text-[var(--color-success)]',
    dot: 'bg-[var(--color-success)]',
  },
}

export function EstadoBadge({ estado }: { estado: EstadoTrabajo }) {
  const s = estilos[estado]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {ETIQUETA_TRABAJO[estado]}
    </span>
  )
}
