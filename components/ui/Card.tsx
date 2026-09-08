import type { ReactNode } from 'react'

type Tono = 'seccion' | 'lista' | 'destacada'

const RADIO: Record<Tono, string> = {
  seccion: 'rounded-[var(--radius-lg)]',
  lista: 'rounded-[14px]',
  destacada: 'rounded-[var(--radius-xl)]',
}

interface Props {
  children: ReactNode
  tono?: Tono
  /** Color del consultorio: pinta el borde izquierdo de 4 px. */
  colorLateral?: string
  className?: string
}

export function Card({ children, tono = 'seccion', colorLateral, className = '' }: Props) {
  return (
    <div
      style={colorLateral ? { borderLeftColor: colorLateral } : undefined}
      className={`border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] ${RADIO[tono]} ${colorLateral ? 'border-l-4' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
