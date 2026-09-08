import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import {
  resumen,
  porMes,
  rankingConsultorios,
  consumoPorProducto,
  rangoMesActual,
} from '@/lib/finanzas/data'
import { margenPct } from '@/lib/finanzas/calculo'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { KpiTile } from '@/components/ui/KpiTile'
import { BarrasMensuales } from '@/components/finanzas/BarrasMensuales'
import { RankingConsultorios } from '@/components/finanzas/RankingConsultorios'
import { UtilidadMensual } from '@/components/finanzas/UtilidadMensual'
import { ConsumoInsumos } from '@/components/finanzas/ConsumoInsumos'

const MESES_LARGOS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'setiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export default async function FinanzasPage() {
  await requireAdmin()
  const { desde, hasta } = rangoMesActual()
  const [res, meses, ranking, consumo] = await Promise.all([
    resumen(desde, hasta),
    porMes(6),
    rankingConsultorios(desde, hasta),
    consumoPorProducto(desde, hasta),
  ])
  const margen = margenPct(res)
  const utilidadTono = res.utilidad >= 0 ? 'exito' : 'peligro'
  const [anio, mes] = desde.split('-')
  const periodo = `${MESES_LARGOS[Number(mes) - 1]} ${anio}`

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold tracking-[-0.03em]">Finanzas</h1>
          <p className="text-[13.5px] capitalize text-[var(--color-muted)]">
            {periodo} · mes actual
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/reportes"
            className="inline-flex h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
          >
            Reportes
          </Link>
          <Link
            href="/finanzas/export"
            className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold"
          >
            CSV
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
        <KpiTile etiqueta="Ingresos" valor={formatMoney(res.ingresos)} />
        <KpiTile etiqueta="Gastos" valor={formatMoney(res.gastos)} />
        <KpiTile
          etiqueta="Utilidad"
          valor={formatMoney(res.utilidad)}
          tono={utilidadTono}
          className="col-span-full sm:col-span-1"
        />
        <KpiTile etiqueta="Margen" valor={`${margen}%`} tono={utilidadTono} />
      </div>

      <Card className="p-3.5">
        <h2 className="text-base font-bold">Desglose de gastos</h2>
        <div className="mt-1.5 space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-[var(--color-muted)]">Materiales + merma</span>
            <span className="num font-semibold">{formatMoney(res.materiales)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[var(--color-muted)]">Pagos a trabajadores</span>
            <span className="num font-semibold">{formatMoney(res.pagos)}</span>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-3.5">
        <h2 className="text-base font-bold">Ingresos vs gastos</h2>
        <BarrasMensuales datos={meses} />
      </Card>

      <Card className="space-y-3 p-3.5">
        <h2 className="text-base font-bold">Top consultorios del mes</h2>
        <RankingConsultorios datos={ranking} />
      </Card>

      <Card className="space-y-3 p-3.5">
        <h2 className="text-base font-bold">Utilidad por mes</h2>
        <UtilidadMensual datos={meses} />
      </Card>

      <Card className="space-y-3 p-3.5">
        <h2 className="text-base font-bold">Insumos más costosos del mes</h2>
        <ConsumoInsumos datos={consumo} />
      </Card>
    </section>
  )
}
