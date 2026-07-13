import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listProductos } from '@/lib/inventario/data'
import { liquidarProductoAction } from '../actions'

export default async function LiquidacionPage() {
  await requireAdmin()
  const productos = await listProductos()

  return (
    <section className="space-y-4">
      <div>
        <Link href="/inventario" className="text-sm text-[var(--color-muted)]">
          ‹ Inventario
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Liquidación de stock</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Ingresa el conteo físico real de cada insumo. La diferencia con el teórico se
          registra como merma (si falta) o ajuste (si sobra).
        </p>
      </div>

      {productos.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          No hay insumos para liquidar.
        </p>
      ) : (
        <ul className="space-y-2">
          {productos.map((p) => (
            <li
              key={p.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate font-medium">{p.nombre}</span>
                <span className="shrink-0 text-sm text-[var(--color-muted)] tabular-nums">
                  Teórico: {p.stock_actual} {p.unidad}
                </span>
              </div>
              <form action={liquidarProductoAction} className="mt-2 flex items-center gap-2">
                <input type="hidden" name="producto_id" value={p.id} />
                <input
                  name="conteo_real"
                  type="number"
                  min="0"
                  step="0.001"
                  defaultValue={p.stock_actual}
                  aria-label={`Conteo real de ${p.nombre}`}
                  className="h-10 w-32 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
                <span className="text-xs text-[var(--color-muted)]">{p.unidad}</span>
                <button
                  type="submit"
                  className="ml-auto h-10 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-contrast)]"
                >
                  Registrar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
