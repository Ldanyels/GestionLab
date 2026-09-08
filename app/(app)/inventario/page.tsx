import Link from 'next/link'
import { requirePermiso } from '@/lib/auth'
import { puede, veMontos } from '@/lib/permisos'
import { listProductos } from '@/lib/inventario/data'
import { formatMoney } from '@/lib/format'
import { SearchBox } from '@/components/ui/SearchBox'

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archivados?: string }>
}) {
  const perfil = await requirePermiso('inventario_ver')
  const montos = veMontos(perfil)
  const puedeEditar = puede(perfil, 'inventario_editar')
  const esAdmin = perfil.rol === 'admin'
  const { q, archivados } = await searchParams
  const verArchivados = archivados === '1'
  const productos = await listProductos(q, verArchivados)
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
        <div className="flex gap-2">
          {puedeEditar ? (
            <Link
              href="/inventario/liquidacion"
              className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
            >
              Liquidar
            </Link>
          ) : null}
          {esAdmin ? (
            <Link
              href="/inventario/nuevo"
              className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-contrast)]"
            >
              + Nuevo
            </Link>
          ) : null}
        </div>
      </div>

      <SearchBox placeholder="Buscar insumo…" defaultValue={q} />

      <Link
        href={verArchivados ? '/inventario' : '/inventario?archivados=1'}
        className="inline-block text-sm text-[var(--color-muted)] underline"
      >
        {verArchivados ? '← Ver activos' : 'Ver archivados'}
      </Link>

      {productos.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          {esAdmin
            ? 'Aún no hay insumos. Toca “+ Nuevo”.'
            : 'Aún no hay insumos registrados.'}
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
                      {montos
                        ? `${formatMoney(p.costo_unitario)} / ${p.unidad}`
                        : `mínimo ${p.stock_minimo} ${p.unidad}`}
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
