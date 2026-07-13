import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listProductos } from '@/lib/inventario/data'
import { formatMoney } from '@/lib/format'

export default async function InventarioPage() {
  await requireAdmin()
  const productos = await listProductos()
  const bajos = productos.filter((p) => p.stock_actual <= p.stock_minimo).length

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>
          {bajos > 0 ? (
            <p className="text-sm text-[var(--color-danger)]">
              {bajos} insumo{bajos === 1 ? '' : 's'} en stock bajo
            </p>
          ) : null}
        </div>
        <Link
          href="/inventario/nuevo"
          className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </div>

      {productos.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          Aún no hay insumos. Toca “+ Nuevo”.
        </p>
      ) : (
        <ul className="space-y-2">
          {productos.map((p) => {
            const bajo = p.stock_actual <= p.stock_minimo
            return (
              <li key={p.id}>
                <Link
                  href={`/inventario/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:border-[var(--color-accent)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.nombre}</span>
                    <span className="block text-xs text-[var(--color-muted)]">
                      {formatMoney(p.costo_unitario)} / {p.unidad}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-right text-sm tabular-nums ${
                      bajo ? 'text-[var(--color-danger)]' : ''
                    }`}
                  >
                    <span className="block font-semibold">
                      {p.stock_actual} {p.unidad}
                    </span>
                    {bajo ? <span className="text-xs">Stock bajo</span> : null}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
