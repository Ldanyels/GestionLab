import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getProducto } from '@/lib/inventario/data'
import { ETIQUETA_MOV } from '@/lib/inventario/types'
import { formatMoney } from '@/lib/format'
import { MovimientoForm } from '@/components/inventario/MovimientoForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { eliminarProductoAction, eliminarMovimientoAction } from '../actions'

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const p = await getProducto(id)
  if (!p) notFound()
  const bajo = p.stock_actual <= p.stock_minimo

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href="/inventario" className="text-sm text-[var(--color-muted)]">
            ‹ Inventario
          </Link>
          <h1 className="truncate text-xl font-semibold tracking-tight">{p.nombre}</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {formatMoney(p.costo_unitario)} / {p.unidad} · mínimo {p.stock_minimo}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/inventario/${p.id}/editar`}
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
          >
            Editar
          </Link>
          <ConfirmDialog
            action={eliminarProductoAction}
            fields={{ id: p.id }}
            triggerLabel="Eliminar"
            triggerClassName="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm text-[var(--color-danger)]"
            title="Eliminar insumo"
            message={`¿Eliminar "${p.nombre}" y su historial de movimientos?`}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 text-center">
        <p className="text-sm text-[var(--color-muted)]">Stock actual</p>
        <p
          className={`text-3xl font-semibold tabular-nums ${
            bajo ? 'text-[var(--color-danger)]' : ''
          }`}
        >
          {p.stock_actual} {p.unidad}
        </p>
        {bajo ? (
          <p className="text-sm text-[var(--color-danger)]">Por debajo del mínimo</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Registrar movimiento</h2>
        <MovimientoForm productoId={p.id} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Historial</h2>
        {p.movimientos.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Sin movimientos aún.</p>
        ) : (
          <ul className="space-y-2">
            {p.movimientos.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium">
                    {ETIQUETA_MOV[m.tipo]}{' '}
                    <span
                      className={`tabular-nums ${
                        m.cantidad >= 0
                          ? 'text-[var(--color-success)]'
                          : 'text-[var(--color-danger)]'
                      }`}
                    >
                      {m.cantidad >= 0 ? '+' : ''}
                      {m.cantidad} {p.unidad}
                    </span>
                  </span>
                  <span className="block text-xs text-[var(--color-muted)]">
                    {m.fecha}
                    {m.motivo ? ` · ${m.motivo}` : ''}
                    {m.trabajo_id ? ' · por trabajo' : ''}
                  </span>
                </span>
                <ConfirmDialog
                  action={eliminarMovimientoAction}
                  fields={{ id: m.id, producto_id: p.id }}
                  triggerLabel="Eliminar"
                  triggerClassName="shrink-0 text-[var(--color-danger)]"
                  title="Eliminar movimiento"
                  message="¿Eliminar este movimiento? El stock se ajustará."
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
