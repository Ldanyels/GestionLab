import { proporcion, etiquetaMes } from '@/lib/finanzas/escala'
import { formatMoney } from '@/lib/format'
import type { PuntoMes } from '@/lib/finanzas/data'

const COLOR_INGRESOS = '#2F6FED'
const COLOR_GASTOS = '#d97706'

/** Ingresos contra gastos de los últimos meses (spec 5.16). */
export function BarrasMensuales({ datos }: { datos: PuntoMes[] }) {
  if (datos.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--color-muted)]">
        Sin movimientos en el periodo.
      </p>
    )
  }

  const maximo = Math.max(...datos.flatMap((d) => [d.ingresos, d.gastos]))

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-[12.5px] text-[var(--color-muted)]">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-[9px] w-[9px] rounded-[2px]"
            style={{ backgroundColor: COLOR_INGRESOS }}
          />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-[9px] w-[9px] rounded-[2px]"
            style={{ backgroundColor: COLOR_GASTOS }}
          />
          Gastos
        </span>
      </div>

      <div className="flex h-[170px] items-end gap-2">
        {datos.map((d) => (
          <div key={d.mes} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="flex h-full w-full items-end justify-center gap-[6%]">
              <div
                title={`Ingresos ${formatMoney(d.ingresos)}`}
                style={{
                  height: `${proporcion(d.ingresos, maximo)}%`,
                  backgroundColor: COLOR_INGRESOS,
                }}
                className="w-[38%] rounded-t-[6px]"
              />
              <div
                title={`Gastos ${formatMoney(d.gastos)}`}
                style={{
                  height: `${proporcion(d.gastos, maximo)}%`,
                  backgroundColor: COLOR_GASTOS,
                }}
                className="w-[38%] rounded-t-[6px]"
              />
            </div>
            <span className="num text-[11.5px] text-[var(--color-muted)]">
              {etiquetaMes(d.mes)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
