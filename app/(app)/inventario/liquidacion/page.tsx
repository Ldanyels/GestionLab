import { requirePermiso } from '@/lib/auth'
import { listProductos } from '@/lib/inventario/data'
import { BackRow } from '@/components/ui/BackRow'
import { Card } from '@/components/ui/Card'
import { liquidarProductoAction } from '../actions'

export default async function LiquidacionPage() {
  await requirePermiso('inventario_editar')
  const productos = await listProductos()

  return (
    <section className="mx-auto max-w-[620px] space-y-4">
      <BackRow href="/inventario" migaDePan="Inventario" titulo="Liquidación de stock" />
      <p className="text-[13.5px] leading-relaxed text-[var(--color-muted)]">
        Ingresa el conteo físico real de cada insumo. La diferencia con el teórico se
        registra como merma (si falta) o ajuste (si sobra).
      </p>

      {productos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">Sin insumos</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            Registra insumos en Inventario para poder liquidarlos.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {productos.map((p) => (
            <li key={p.id}>
              <Card tono="lista" className="space-y-2.5 p-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-base font-semibold">
                    {p.nombre}
                  </span>
                  <span className="num shrink-0 text-[13px] text-[var(--color-muted)]">
                    Teórico: {p.stock_actual} {p.unidad}
                  </span>
                </div>
                <form
                  action={liquidarProductoAction}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="producto_id" value={p.id} />
                  <input
                    name="conteo_real"
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue={p.stock_actual}
                    aria-label={`Conteo real de ${p.nombre}`}
                    className="num h-11 w-[110px] shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-base outline-none focus:border-[var(--color-accent)]"
                  />
                  <span className="shrink-0 text-[13px] text-[var(--color-muted)]">
                    {p.unidad}
                  </span>
                  <button
                    type="submit"
                    className="ml-auto h-11 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
                  >
                    Registrar
                  </button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
