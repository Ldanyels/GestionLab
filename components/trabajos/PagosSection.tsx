import { listAbonos } from '@/lib/abonos/data'
import { totalPagado, saldoPendiente, estadoPago } from '@/lib/abonos/saldo'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { AbonoForm } from './AbonoForm'
import { AbonoEditable } from './AbonoEditable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { eliminarAbonoAction } from '@/app/(app)/trabajos/actions'

export async function PagosSection({
  trabajoId,
  precio,
  puedeBorrar,
  puedeEditar,
}: {
  trabajoId: string
  precio: number
  /**
   * Si es falso, no aparece el botón de eliminar de cada abono. Borrar es solo
   * del administrador: hace desaparecer el registro.
   *
   * **Corregir es distinto y sí lo puede hacer el técnico** (ver `puedeEditar`):
   * quien puede registrar un abono de cualquier monto ya tiene el poder de
   * equivocarse en cualquier dirección, y obligarlo a pedir ayuda por un error
   * de tecleo volvía inútil su permiso. Lo que protege el dinero no es el muro,
   * es que el monto anterior queda en el historial.
   *
   * Las acciones lo comprueban en el servidor; esto es solo para no ofrecer
   * botones que van a rebotar.
   */
  puedeBorrar: boolean
  /** Quien puede registrar abonos puede corregirlos. */
  puedeEditar: boolean
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
                <AbonoEditable abono={a} trabajoId={trabajoId} puedeEditar={puedeEditar} />
                {puedeBorrar ? (
                  <div className="px-3.5 pb-2.5">
                    <ConfirmDialog
                      action={eliminarAbonoAction}
                      fields={{ id: a.id, trabajo_id: trabajoId }}
                      triggerLabel="Eliminar"
                      triggerClassName="text-[13px] font-semibold text-[var(--color-danger)]"
                      title="Eliminar abono"
                      message={`Se borra el abono de ${formatMoney(a.monto)} y el saldo vuelve a subir.`}
                      confirmLabel="Sí, eliminar"
                    />
                  </div>
                ) : null}
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
