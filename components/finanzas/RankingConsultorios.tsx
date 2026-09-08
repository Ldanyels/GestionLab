import { proporcion } from '@/lib/finanzas/escala'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import type { RankingItem } from '@/lib/finanzas/data'

/** Top de consultorios por ingreso, con barra relativa al mayor (spec 5.16). */
export function RankingConsultorios({ datos }: { datos: RankingItem[] }) {
  if (datos.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--color-muted)]">
        Sin ingresos en el periodo.
      </p>
    )
  }

  const maximo = Math.max(...datos.map((d) => d.ingreso))

  return (
    <ul className="space-y-2.5">
      {datos.map((d) => (
        <li key={d.consultorio} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{d.consultorio}</span>
            <span className="num shrink-0 font-semibold">{formatMoney(d.ingreso)}</span>
          </div>
          <div className="h-[7px] overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <div
              style={{
                width: `${proporcion(d.ingreso, maximo)}%`,
                backgroundColor: colorConsultorio(d.consultorio),
              }}
              className="h-full rounded-full"
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
