import { listAbonos } from '@/lib/abonos/data'
import {
  totalPagado,
  saldoPendiente,
  estadoPago,
  ETIQUETA_PAGO,
} from '@/lib/abonos/saldo'
import { formatMoney } from '@/lib/format'
import { AbonoForm } from './AbonoForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { eliminarAbonoAction } from '@/app/(app)/trabajos/actions'

export async function PagosSection({
  trabajoId,
  precio,
}: {
  trabajoId: string
  precio: number
}) {
  const abonos = await listAbonos(trabajoId)
  const pagado = totalPagado(abonos)
  const saldo = saldoPendiente(precio, abonos)
  const estado = estadoPago(precio, pagado)

  const saldoColor =
    estado === 'pagado'
      ? 'text-[var(--color-success)]'
      : 'text-[var(--color-danger)]'

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Pagos</h2>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
          <p className="text-[var(--color-muted)]">Precio</p>
          <p className="font-semibold tabular-nums">{formatMoney(precio)}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
          <p className="text-[var(--color-muted)]">Pagado</p>
          <p className="font-semibold tabular-nums">{formatMoney(pagado)}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
          <p className="text-[var(--color-muted)]">Saldo</p>
          <p className={`font-semibold tabular-nums ${saldoColor}`}>
            {formatMoney(saldo)}
          </p>
        </div>
      </div>
      <p className="text-center text-xs text-[var(--color-muted)]">
        Estado: {ETIQUETA_PAGO[estado]}
      </p>

      {abonos.length > 0 ? (
        <ul className="space-y-2">
          {abonos.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
            >
              <span className="min-w-0">
                <span className="font-medium tabular-nums">{formatMoney(a.monto)}</span>
                <span className="block text-xs text-[var(--color-muted)]">
                  {a.fecha} · {a.metodo}
                  {a.nota ? ` · ${a.nota}` : ''}
                </span>
              </span>
              <ConfirmDialog
                action={eliminarAbonoAction}
                fields={{ id: a.id, trabajo_id: trabajoId }}
                triggerLabel="Eliminar"
                triggerClassName="text-[var(--color-danger)]"
                title="Eliminar abono"
                message={`¿Eliminar el abono de ${formatMoney(a.monto)}?`}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          Sin abonos aún. El primero es el adelanto.
        </p>
      )}

      <AbonoForm trabajoId={trabajoId} />
    </div>
  )
}
