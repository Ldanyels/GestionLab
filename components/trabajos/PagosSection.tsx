import { listAbonos } from '@/lib/abonos/data'
import { totalPagado, saldoPendiente, estadoPago } from '@/lib/abonos/saldo'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
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
    estado === 'pagado' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'

  return (
    <div className="space-y-2.5">
      <h2 className="text-[17px] font-bold">Pagos</h2>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Cifra etiqueta="Precio" valor={formatMoney(precio)} />
        <Cifra etiqueta="Pagado" valor={formatMoney(pagado)} />
        <Cifra etiqueta="Saldo" valor={formatMoney(saldo)} className={saldoColor} />
      </div>

      {abonos.length > 0 ? (
        <Card>
          <ul>
            {abonos.map((a, i) => (
              <li
                key={a.id}
                className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}
              >
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <span className="min-w-0">
                    <span className="num block font-semibold text-[var(--color-success)]">
                      {formatMoney(a.monto)}
                    </span>
                    <span className="block truncate text-xs text-[var(--color-muted)]">
                      {a.fecha} · {a.metodo}
                      {a.nota ? ` · ${a.nota}` : ''}
                    </span>
                  </span>
                  <ConfirmDialog
                    action={eliminarAbonoAction}
                    fields={{ id: a.id, trabajo_id: trabajoId }}
                    triggerLabel="Eliminar"
                    triggerClassName="shrink-0 text-[13px] font-semibold text-[var(--color-danger)]"
                    title="Eliminar abono"
                    message={`Se borra el abono de ${formatMoney(a.monto)} y el saldo vuelve a subir.`}
                    confirmLabel="Sí, eliminar"
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          Sin abonos aún. El primero se registra como adelanto.
        </p>
      )}

      <AbonoForm trabajoId={trabajoId} />
    </div>
  )
}

function Cifra({
  etiqueta,
  valor,
  className = '',
}: {
  etiqueta: string
  valor: string
  className?: string
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2.5">
      <p className="text-xs text-[var(--color-muted)]">{etiqueta}</p>
      <p className={`num text-[15px] font-bold ${className}`}>{valor}</p>
    </div>
  )
}
