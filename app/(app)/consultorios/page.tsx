import Link from 'next/link'
import { listConsultorios } from '@/lib/consultorios/data'

export default async function ConsultoriosPage() {
  const consultorios = await listConsultorios()

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Consultorios</h1>
        <Link
          href="/consultorios/nuevo"
          className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </div>

      {consultorios.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          Aún no hay consultorios. Toca “+ Nuevo” para agregar el primero.
        </p>
      ) : (
        <ul className="space-y-2">
          {consultorios.map((c) => (
            <li key={c.id}>
              <Link
                href={`/consultorios/${c.id}`}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:border-[var(--color-accent)]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.nombre}</span>
                  {c.contacto ? (
                    <span className="block truncate text-sm text-[var(--color-muted)]">
                      {c.contacto}
                    </span>
                  ) : null}
                </span>
                <span aria-hidden className="text-[var(--color-muted)]">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
