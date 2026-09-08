'use client'

import { useEffect, type ReactNode } from 'react'

interface Props {
  abierta: boolean
  onCerrar: () => void
  titulo: string
  children: ReactNode
  /** Ancho máximo del panel. 560 px para selección, 420 px para confirmar. */
  anchoMax?: number
}

export function Sheet({ abierta, onCerrar, titulo, children, anchoMax = 560 }: Props) {
  useEffect(() => {
    if (!abierta) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierta, onCerrar])

  if (!abierta) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={onCerrar}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(10,13,18,0.5)] sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: anchoMax }}
        className="flex max-h-[82vh] w-full flex-col rounded-t-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-pop)] motion-safe:animate-[sheetIn_220ms_ease-out] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] p-4">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCerrar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-muted)]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
