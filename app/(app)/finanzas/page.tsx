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
import { gastosDelPeriodo } from '@/lib/gastos/data'
import { resumenDeGastos } from '@/lib/gastos/resumen'
import { ETIQUETA_CATEGORIA } from '@/lib/gastos/categorias'
import { pagosDelPeriodo } from '@/lib/trabajadores/data'
import { resumenDeManoDeObra } from '@/lib/trabajadores/resumen'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { KpiTile } from '@/components/ui/KpiTile'
import { BarrasMensuales } from '@/components/finanzas/BarrasMensuales'
import { RankingConsultorios } from '@/components/finanzas/RankingConsultorios'
import { UtilidadMensual } from '@/components/finanzas/UtilidadMensual'
import { ConsumoInsumos } from '@/components/finanzas/ConsumoInsumos'
import { FilaDeGasto } from '@/components/finanzas/FilaDeGasto'
import { EnlaceAccion } from '@/components/ui/EnlaceAccion'

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
  const [res, meses, ranking, consumo, gastos, pagos] = await Promise.all([
    resumen(desde, hasta),
    porMes(6),
    rankingConsultorios(desde, hasta),
    consumoPorProducto(desde, hasta),
    gastosDelPeriodo(desde, hasta),
    pagosDelPeriodo(desde, hasta),
  ])
  const gastosDelMes = resumenDeGastos(gastos)
  const manoDeObra = resumenDeManoDeObra(pagos, res.ingresos)
  const margen = margenPct(res)
  const utilidadTono = res.utilidad >= 0 ? 'exito' : 'peligro'
  const [anio, mes] = desde.split('-')
  const periodo = `${MESES_LARGOS[Number(mes) - 1]} ${anio}`

  return (
    <section className="space-y-4">
      {/* En móvil los botones bajan a su propia fila: no caben junto al título. */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold tracking-[-0.03em]">Finanzas</h1>
          <p className="text-[13.5px] capitalize text-[var(--color-muted)]">
            {periodo} · mes actual
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/reportes"
            className="inline-flex h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
          >
            Reportes
          </Link>
          {/*
            Gastos en la cabecera y no solo al pie de su tarjeta: registrar el
            recibo de luz es de las pocas cosas que se vienen a hacer a esta
            pantalla, y tres tarjetas más abajo no se encuentra.
          */}
          <Link
            href="/finanzas/gastos"
            className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-accent)]"
          >
            Gastos
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

      {/*
        El desglose de gastos, con la parte de cada uno sobre el total.

        La barra no es decoración: un desglose de tres importes sueltos obliga a
        dividir mentalmente para saber cuál pesa. La proporción es la pregunta.
      */}
      <Card className="p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-bold">Desglose de gastos</h2>
          <span className="num text-[15px] font-bold">{formatMoney(res.gastos)}</span>
        </div>
        <div className="mt-2 space-y-2 text-sm">
          <FilaDeGasto etiqueta="Materiales + merma" monto={res.materiales} total={res.gastos} />
          <FilaDeGasto etiqueta="Mano de obra" monto={res.pagos} total={res.gastos} />
          <FilaDeGasto
            etiqueta="Servicios, equipo y otros"
            monto={res.operativos}
            total={res.gastos}
          />
        </div>
        {res.operativos === 0 ? (
          <p className="mt-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
            No hay gastos de servicios registrados este mes. Mientras la luz, el agua o el
            alquiler no estén aquí, la utilidad de arriba es más alta que la real.
          </p>
        ) : null}
      </Card>

      {/*
        Mano de obra: cuánto se llevó cada uno y qué parte de los ingresos es.

        El porcentaje sobre ingresos va arriba y grande porque es el número que
        dice si el negocio aguanta; el importe suelto no lo delata.
      */}
      <Card className="p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-bold">Mano de obra</h2>
          <span className="num text-[15px] font-bold">{formatMoney(manoDeObra.total)}</span>
        </div>
        {manoDeObra.porTrabajador.length === 0 ? (
          <p className="mt-1.5 text-[13px] text-[var(--color-muted)]">
            Sin pagos a trabajadores este mes.
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">
              <span className="num font-bold text-[var(--color-text)]">
                {manoDeObra.porcentajeDeIngresos}%
              </span>{' '}
              de lo que facturaste este mes
            </p>
            <div className="mt-2 space-y-2 text-sm">
              {manoDeObra.porTrabajador.map((t) => (
                <FilaDeGasto
                  key={t.trabajador_id}
                  etiqueta={`${t.trabajador}${t.pagos > 1 ? ` · ${t.pagos} pagos` : ''}`}
                  monto={t.monto}
                  total={manoDeObra.total}
                />
              ))}
            </div>
          </>
        )}
        <EnlaceAccion href="/configuracion/trabajadores" className="mt-3">
          Registrar un pago
        </EnlaceAccion>
      </Card>

      {/* Servicios, equipo y otros, por concepto: «cuánto me cuesta la luz». */}
      <Card className="p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-bold">Servicios y otros gastos</h2>
          <span className="num text-[15px] font-bold">{formatMoney(gastosDelMes.total)}</span>
        </div>
        {gastosDelMes.detalle.length === 0 ? (
          <p className="mt-1.5 text-[13px] text-[var(--color-muted)]">
            Nada registrado este mes.
          </p>
        ) : (
          <div className="mt-2 space-y-2 text-sm">
            {gastosDelMes.detalle.map((l) => (
              <FilaDeGasto
                key={`${l.categoria}-${l.concepto}`}
                etiqueta={`${l.concepto}${l.veces > 1 ? ` ×${l.veces}` : ''} · ${ETIQUETA_CATEGORIA[l.categoria]}`}
                monto={l.monto}
                total={gastosDelMes.total}
              />
            ))}
          </div>
        )}
        <EnlaceAccion href="/finanzas/gastos" className="mt-3">
          Registrar un gasto
        </EnlaceAccion>
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
