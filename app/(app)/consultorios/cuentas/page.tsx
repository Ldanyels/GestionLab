import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { filasReporte } from '@/lib/reportes/data'
import { agruparPorConsultorio } from '@/lib/reportes/agrupar'
import { SearchBox } from '@/components/ui/SearchBox'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'

function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export default async function CuentasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; todos?: string }>
}) {
  await requireAdmin()
  const { q, todos } = await searchParams
  const soloDeudores = todos !== '1'

  const filas = await filasReporte()
  const { grupos, totales } = agruparPorConsultorio(filas)

  // El toggle conserva la búsqueda activa.
  const toggleParams = new URLSearchParams()
  if (q) toggleParams.set('q', q)
  if (soloDeudores) toggleParams.set('todos', '1')
  const toggleQs = toggleParams.toString()

  const busqueda = normalizar(q?.trim() ?? '')
  const visibles = grupos
    .filter((g) => (soloDeudores ? g.saldo > 0.001 : true))
    .map((g) => {
      if (!busqueda) return g
      // Coincide el consultorio: se muestra completo; si no, solo los doctores que coinciden.
      if (normalizar(g.consultorio).includes(busqueda)) return g
      const doctores = g.doctores.filter((d) => normalizar(d.doctor).includes(busqueda))
      return doctores.length > 0 ? { ...g, doctores } : null
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href="/consultorios" className="text-sm text-[var(--color-muted)]">
            ‹ Consultorios
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Estado de cuenta</h1>
          <p className="text-sm text-[var(--color-muted)]">Deuda por consultorio y doctor</p>
        </div>
        <Link
          href="/consultorios/cuentas/export"
          className="inline-flex h-10 shrink-0 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
        >
          CSV
        </Link>
      </div>

      <SearchBox
        placeholder="Buscar consultorio o doctor…"
        defaultValue={q}
        hidden={soloDeudores ? undefined : { todos: '1' }}
      />

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="text-sm text-[var(--color-muted)]">Total por cobrar</p>
        <p className="num text-2xl font-semibold text-[var(--color-danger)]">
          {formatMoney(totales.saldo)}
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          {formatMoney(totales.pagado)} cobrado de {formatMoney(totales.facturado)} de monto
          final
        </p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <Link
          href={`/consultorios/cuentas?${toggleQs}`}
          className="text-[var(--color-muted)] underline"
        >
          {soloDeudores ? 'Ver todos los consultorios' : '← Ver solo los que deben'}
        </Link>
        <Link href="/reportes" className="font-medium text-[var(--color-accent)]">
          Reportes por fecha →
        </Link>
      </div>

      {visibles.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          {busqueda
            ? `Sin resultados para “${q}”.`
            : soloDeudores
              ? 'Nadie tiene deuda pendiente.'
              : 'Aún no hay movimientos por consultorio.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {visibles.map((g) => (
            <li
              key={g.consultorio_id}
              style={{ borderLeftColor: colorConsultorio(g.consultorio) }}
              className="space-y-2 rounded-[var(--radius-md)] border border-l-4 border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate font-medium">{g.consultorio}</span>
                <span
                  className={`num shrink-0 font-semibold ${
                    g.saldo > 0.001
                      ? 'text-[var(--color-danger)]'
                      : 'text-[var(--color-success)]'
                  }`}
                >
                  {formatMoney(g.saldo)}
                </span>
              </div>

              <ul className="space-y-1 border-l border-[var(--color-border)] pl-3">
                {g.doctores.map((d) => (
                  <li key={d.doctor_id}>
                    <Link
                      href={`/doctores/${d.doctor_id}`}
                      className="flex items-baseline justify-between gap-2 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        {d.doctor}
                        <span className="text-[var(--color-muted)]">
                          {' '}
                          · {d.filas.length} trab.
                        </span>
                      </span>
                      <span
                        className={`num shrink-0 ${
                          d.saldo > 0.001
                            ? 'text-[var(--color-danger)]'
                            : 'text-[var(--color-muted)]'
                        }`}
                      >
                        {formatMoney(d.saldo)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
