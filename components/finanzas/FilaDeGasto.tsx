import { formatMoney } from '@/lib/format'

/**
 * Una línea del desglose, con su parte del total.
 *
 * La barra no es decoración. Tres importes sueltos obligan a dividir
 * mentalmente para saber cuál pesa, y el peso relativo es justo la pregunta que
 * se le hace a un desglose de gastos.
 */
export function FilaDeGasto({
  etiqueta,
  monto,
  total,
}: {
  etiqueta: string
  monto: number
  /** El total contra el que se compara. Si es 0, la barra queda vacía. */
  total: number
}) {
  // Sin total no hay proporción que mostrar: una barra llena con todo en cero
  // diría que esa línea es el 100% de nada.
  const pct = total > 0 ? Math.round((monto / total) * 100) : 0

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[var(--color-muted)]">{etiqueta}</span>
        <span className="shrink-0">
          <span className="num font-semibold">{formatMoney(monto)}</span>
          <span className="num ml-1.5 text-[12px] text-[var(--color-muted)]">{pct}%</span>
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]"
        role="presentation"
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
