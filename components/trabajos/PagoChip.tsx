import { formatMoney } from '@/lib/format'

/** Chip compacto de estado de pago para listas. */
export function PagoChip({ saldo }: { saldo: number }) {
  const pagado = saldo <= 0.001
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
        pagado
          ? 'bg-[var(--color-success)]/12 text-[var(--color-success)]'
          : 'bg-[var(--color-danger)]/12 text-[var(--color-danger)]'
      }`}
    >
      {pagado ? 'Pagado' : `Debe ${formatMoney(saldo)}`}
    </span>
  )
}
