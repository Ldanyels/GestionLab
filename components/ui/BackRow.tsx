import Link from 'next/link'

interface Props {
  href: string
  titulo: string
  /** Texto de contexto sobre el título (ej. "Configuración"). */
  migaDePan?: string
}

export function BackRow({ href, titulo, migaDePan }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={href}
        aria-label="Volver"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <div className="min-w-0">
        {migaDePan ? (
          <p className="text-[13.5px] text-[var(--color-muted)]">{migaDePan}</p>
        ) : null}
        <h1 className="truncate text-2xl font-bold">{titulo}</h1>
      </div>
    </div>
  )
}
