import Link from 'next/link'
import { getSessionPerfil } from '@/lib/auth'
import { listTrabajos } from '@/lib/trabajos/data'
import { formatMoney } from '@/lib/format'

export default async function HoyPage() {
  const [perfil, enCurso] = await Promise.all([
    getSessionPerfil(),
    listTrabajos('en_curso'),
  ])

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Hoy</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Hola, {perfil?.nombre}. Tienes {enCurso.length} trabajo
          {enCurso.length === 1 ? '' : 's'} en curso.
        </p>
      </div>

      <Link
        href="/trabajos/nuevo"
        className="flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] font-medium text-[var(--color-accent-contrast)]"
      >
        + Nuevo trabajo
      </Link>

      {enCurso.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">
          No hay trabajos en curso.
        </p>
      ) : (
        <ul className="space-y-2">
          {enCurso.map((t) => (
            <li key={t.id}>
              <Link
                href={`/trabajos/${t.id}`}
                className="block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:border-[var(--color-accent)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">{t.tipo_nombre}</span>
                  <span className="shrink-0 text-sm tabular-nums">
                    {formatMoney(t.precio_acordado)}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-[var(--color-muted)]">
                  {t.doctor_nombre} · {t.consultorio_nombre}
                  {t.paciente_nombre ? ` · ${t.paciente_nombre}` : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
