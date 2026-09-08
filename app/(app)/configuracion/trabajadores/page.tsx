import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listTrabajadores } from '@/lib/trabajadores/data'
import { BackRow } from '@/components/ui/BackRow'
import { Card } from '@/components/ui/Card'

export default async function TrabajadoresPage() {
  await requireAdmin()
  const trabajadores = await listTrabajadores()

  return (
    <section className="mx-auto max-w-[620px] space-y-4">
      <div className="flex items-start justify-between gap-3">
        <BackRow
          href="/configuracion"
          titulo="Trabajadores"
          migaDePan="Configuración"
        />
        <Link
          href="/configuracion/trabajadores/nuevo"
          className="mt-1 inline-flex h-11 shrink-0 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </div>

      {trabajadores.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">Sin trabajadores</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            Toca «+ Nuevo» para registrar al primero.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {trabajadores.map((t) => (
            <li key={t.id}>
              <Link href={`/configuracion/trabajadores/${t.id}`} className="block">
                <Card
                  tono="lista"
                  className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-[var(--color-accent)]"
                >
                  <span className="min-w-0 truncate text-[15.5px] font-semibold">
                    {t.nombre}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="shrink-0 text-[var(--color-muted)]"
                    aria-hidden
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
