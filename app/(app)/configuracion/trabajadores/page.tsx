import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listTrabajadores } from '@/lib/trabajadores/data'

export default async function TrabajadoresPage() {
  await requireAdmin()
  const trabajadores = await listTrabajadores()

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/configuracion" className="text-sm text-[var(--color-muted)]">
            ‹ Configuración
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Trabajadores</h1>
        </div>
        <Link
          href="/configuracion/trabajadores/nuevo"
          className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </div>

      {trabajadores.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          Aún no hay trabajadores. Toca “+ Nuevo”.
        </p>
      ) : (
        <ul className="space-y-2">
          {trabajadores.map((t) => (
            <li key={t.id}>
              <Link
                href={`/configuracion/trabajadores/${t.id}`}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:border-[var(--color-accent)]"
              >
                <span className="truncate font-medium">{t.nombre}</span>
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
