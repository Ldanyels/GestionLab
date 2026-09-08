import type { ReactNode } from 'react'

type Tono = 'neutro' | 'acento' | 'exito' | 'peligro' | 'aviso'

const TONOS: Record<Tono, string> = {
  neutro: 'bg-[var(--color-surface-2)] text-[var(--color-muted)]',
  acento: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
  exito: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  peligro: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  aviso: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]',
}

interface Props {
  children: ReactNode
  tono: Tono
  /** Punto de 6 px antes del texto (chips de estado). */
  conPunto?: boolean
}

export function Chip({ children, tono, conPunto }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-bold ${TONOS[tono]}`}
    >
      {conPunto ? (
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  )
}
