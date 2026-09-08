import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { filasReporte } from '@/lib/reportes/data'
import { agruparPorConsultorio } from '@/lib/reportes/agrupar'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { SearchBox } from '@/components/ui/SearchBox'

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export default async function CuentasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; todos?: string }>
}) {
  await requireAdmin()
  const { q, todos } = await searchParams
  const soloDeudores = todos !== '1'

  const { grupos, totales } = agruparPorConsultorio(await filasReporte())

  const busqueda = normalizar(q?.trim() ?? '')
  const visibles = grupos
    .filter((g) => (soloDeudores ? g.saldo > 0.001 : true))
    .map((g) => {
      if (!busqueda) return g
      if (normalizar(g.consultorio).includes(busqueda)) return g
      const doctores = g.doctores.filter((d) => normalizar(d.doctor).includes(busqueda))
      return doctores.length > 0 ? { ...g, doctores } : null
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)

  const toggleParams = new URLSearchParams()
  if (q) toggleParams.set('q', q)
  if (soloDeudores) toggleParams.set('todos', '1')

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/consultorios"
            className="text-[13.5px] text-[var(--color-muted)]"
          >
            ‹ Consultorios
          </Link>
          <h1 className="text-2xl font-bold tracking-[-0.02em]">Estado de cuenta</h1>
          <p className="text-[13.5px] text-[var(--color-muted)]">
            Deuda por consultorio y doctor
          </p>
        </div>
        <Link
          href="/consultorios/cuentas/export"
          className="inline-flex h-11 shrink-0 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold"
        >
          CSV
        </Link>
      </div>

      <Card tono="destacada" className="p-4">
        <p className="text-[13px] font-semibold text-[var(--color-muted)]">
          Total por cobrar
        </p>
        <p className="num text-[34px] font-bold leading-none text-[var(--color-danger)]">
          {formatMoney(totales.saldo)}
        </p>
        <p className="mt-1.5 text-[13px] text-[var(--color-muted)]">
          {formatMoney(totales.pagado)} cobrado de {formatMoney(totales.facturado)} de monto
          final
        </p>
      </Card>

      <SearchBox
        placeholder="Buscar consultorio o doctor…"
        defaultValue={q}
        hidden={soloDeudores ? undefined : { todos: '1' }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-[13.5px]">
        <Link
          href={`/consultorios/cuentas?${toggleParams.toString()}`}
          className="text-[var(--color-muted)] underline"
        >
          {soloDeudores ? 'Ver todos los consultorios' : '← Ver solo los que deben'}
        </Link>
        <Link href="/reportes" className="font-semibold text-[var(--color-accent)]">
          Reportes por fecha →
        </Link>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">
            {busqueda ? 'Sin resultados' : 'Nadie debe'}
          </p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            {busqueda
              ? `No hay coincidencias para «${q}».`
              : 'Todas las cuentas están al día.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visibles.map((g) => (
            <li key={g.consultorio_id}>
              <Card
                tono="lista"
                colorLateral={colorConsultorio(g.consultorio)}
                className="p-3.5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-base font-bold">
                    {g.consultorio}
                  </span>
                  <span
                    className={`num shrink-0 font-bold ${
                      g.saldo > 0.001
                        ? 'text-[var(--color-danger)]'
                        : 'text-[var(--color-success)]'
                    }`}
                  >
                    {formatMoney(g.saldo)}
                  </span>
                </div>

                <ul className="mt-2 space-y-1 border-l border-[var(--color-border)] pl-3">
                  {g.doctores.map((d) => (
                    <li key={d.doctor_id}>
                      <Link
                        href={`/doctores/${d.doctor_id}`}
                        className="flex items-baseline justify-between gap-3 text-sm"
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
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
