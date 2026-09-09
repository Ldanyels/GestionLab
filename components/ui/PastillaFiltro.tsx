import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  href: string
  children: ReactNode
  activa: boolean
  /** Número al lado de la etiqueta. Se omite cuando no aplica. */
  conteo?: number
}

/**
 * Pastilla de filtro que navega por URL.
 *
 * Compartida por las dos filas de la pantalla de Trabajos —estado y fecha—
 * para que no se separen visualmente con el tiempo.
 */
export function PastillaFiltro({ href, children, activa, conteo }: Props) {
  return (
    <Link
      href={href}
      aria-current={activa ? 'page' : undefined}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${
        activa
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] font-semibold text-[var(--color-accent-contrast)]'
          : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
      }`}
    >
      {children}
      {conteo !== undefined ? <span className="num text-xs opacity-70">{conteo}</span> : null}
    </Link>
  )
}
