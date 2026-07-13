import { requireAdmin } from '@/lib/auth'
import {
  resumen,
  porMes,
  rankingConsultorios,
  rangoMesActual,
} from '@/lib/finanzas/data'
import { margenPct } from '@/lib/finanzas/calculo'
import { formatMoney } from '@/lib/format'
import { BarrasMensuales } from '@/components/finanzas/BarrasMensuales'
import { RankingConsultorios } from '@/components/finanzas/RankingConsultorios'

export default async function FinanzasPage() {
  await requireAdmin()
  const { desde, hasta } = rangoMesActual()
  const [res, meses, ranking] = await Promise.all([
    resumen(desde, hasta),
    porMes(6),
    rankingConsultorios(desde, hasta),
  ])
  const margen = margenPct(res)
  const utilidadColor =
    res.utilidad >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Finanzas</h1>
        <p className="text-sm text-[var(--color-muted)]">Mes actual</p>
      </div>

      {/* KPIs (stat tiles) */}
      <div className="grid grid-cols-2 gap-3">
        <Tile label="Ingresos" valor={formatMoney(res.ingresos)} />
        <Tile label="Gastos" valor={formatMoney(res.gastos)} />
        <Tile label="Utilidad" valor={formatMoney(res.utilidad)} className={utilidadColor} />
        <Tile label="Margen" valor={`${margen}%`} className={utilidadColor} />
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm">
        <p className="font-medium">Desglose de gastos</p>
        <div className="mt-1 flex justify-between text-[var(--color-muted)]">
          <span>Materiales + merma</span>
          <span className="tabular-nums">{formatMoney(res.materiales)}</span>
        </div>
        <div className="flex justify-between text-[var(--color-muted)]">
          <span>Pagos a trabajadores</span>
          <span className="tabular-nums">{formatMoney(res.pagos)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Ingresos vs Gastos (últimos 6 meses)</h2>
        <BarrasMensuales datos={meses} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Top consultorios (mes actual)</h2>
        <RankingConsultorios datos={ranking} />
      </div>
    </section>
  )
}

function Tile({
  label,
  valor,
  className = '',
}: {
  label: string
  valor: string
  className?: string
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${className}`}>{valor}</p>
    </div>
  )
}
