import Link from 'next/link'
import { listTrabajos } from '@/lib/trabajos/data'
import { ETIQUETA_TRABAJO, type EstadoTrabajo } from '@/lib/trabajos/estado'
import { EstadoBadge } from '@/components/trabajos/EstadoBadge'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'

const FILTROS: { label: string; estado?: EstadoTrabajo }[] = [
  { label: 'Todos' },
  { label: 'En curso', estado: 'en_curso' },
  { label: 'Cerrados', estado: 'cerrado' },
  { label: 'Entregados', estado: 'entregado' },
]

export default async function TrabajosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado } = await searchParams
  const filtroEstado = (['en_curso', 'cerrado', 'entregado'] as const).find(
    (e) => e === estado,
  )
  const trabajos = await listTrabajos(filtroEstado)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Trabajos</h1>
        <Link
          href="/trabajos/nuevo"
          className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map((f) => {
          const activo = (f.estado ?? undefined) === filtroEstado
          const href = f.estado ? `/trabajos?estado=${f.estado}` : '/trabajos'
          return (
            <Link
              key={f.label}
              href={href}
              className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
                activo
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)]'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {trabajos.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          No hay trabajos {filtroEstado ? `(${ETIQUETA_TRABAJO[filtroEstado]})` : ''}. Toca
          “+ Nuevo”.
        </p>
      ) : (
        <ul className="space-y-2">
          {trabajos.map((t) => (
            <li key={t.id}>
              <Link
                href={`/trabajos/${t.id}`}
                className="block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:border-[var(--color-accent)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">{t.tipo_nombre}</span>
                  <EstadoBadge estado={t.estado} />
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-sm text-[var(--color-muted)]">
                  <span className="flex min-w-0 items-center gap-1.5 truncate">
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: colorConsultorio(t.consultorio_nombre) }}
                    />
                    {t.doctor_nombre} · {t.consultorio_nombre}
                    {t.paciente_nombre ? ` · ${t.paciente_nombre}` : ''}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatMoney(t.precio_acordado)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
