import Link from 'next/link'
import { listConsultorios } from '@/lib/consultorios/data'
import { colorConsultorio } from '@/lib/consultorios/color'
import { SearchBox } from '@/components/ui/SearchBox'
import { getSessionPerfil } from '@/lib/auth'

export default async function ConsultoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const [consultorios, perfil] = await Promise.all([
    listConsultorios(q),
    getSessionPerfil(),
  ])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Consultorios</h1>
        <div className="flex gap-2">
          {perfil?.rol === 'admin' ? (
            <Link
              href="/consultorios/cuentas"
              className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
            >
              Cuentas
            </Link>
          ) : null}
          <Link
            href="/consultorios/nuevo"
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-contrast)]"
          >
            + Nuevo
          </Link>
        </div>
      </div>

      <SearchBox placeholder="Buscar consultorio…" defaultValue={q} />

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
                style={{ borderLeftColor: colorConsultorio(c.nombre) }}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-l-4 border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:border-[var(--color-accent)]"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-8 w-8 shrink-0 rounded-full"
                    style={{ backgroundColor: `${colorConsultorio(c.nombre)}1f` }}
                  >
                    <span
                      className="flex h-full w-full items-center justify-center text-sm font-semibold"
                      style={{ color: colorConsultorio(c.nombre) }}
                    >
                      {c.nombre.trim().charAt(0).toUpperCase()}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.nombre}</span>
                    {c.contacto ? (
                      <span className="block truncate text-sm text-[var(--color-muted)]">
                        {c.contacto}
                      </span>
                    ) : null}
                  </span>
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
