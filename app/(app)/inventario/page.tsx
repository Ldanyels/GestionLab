import Link from 'next/link'
import { requirePermiso } from '@/lib/auth'
import { puede, veMontos } from '@/lib/permisos'
import { listProductos } from '@/lib/inventario/data'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
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
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold tracking-[-0.03em]">Inventario</h1>
          {bajos > 0 ? (
            <p className="text-[13.5px] text-[var(--color-danger)]">
              {bajos} insumo{bajos === 1 ? '' : 's'} en stock bajo
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          {puedeEditar ? (
            <Link
              href="/inventario/liquidacion"
              className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold"
            >
              Liquidar stock
            </Link>
          ) : null}
          {esAdmin ? (
            <Link
              href="/inventario/nuevo"
              className="inline-flex h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
            >
              + Nuevo
            </Link>
          ) : null}
        </div>
      </div>

      <SearchBox
        placeholder="Buscar insumo…"
        defaultValue={q}
        hidden={verArchivados ? { archivados: '1' } : undefined}
      />

      <Link
        href={verArchivados ? '/inventario' : '/inventario?archivados=1'}
        className="inline-block text-[13.5px] text-[var(--color-muted)] underline"
      >
        {verArchivados ? '← Ver activos' : 'Ver archivados'}
      </Link>

      {productos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">
            {verArchivados ? 'Sin insumos archivados' : 'Aún no hay insumos'}
          </p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            {esAdmin && !verArchivados
              ? 'Toca «+ Nuevo» para registrar el primero.'
              : 'Nada que mostrar por ahora.'}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
          {productos.map((p) => {
            const bajo = p.stock_actual <= p.stock_minimo
            return (
              <li key={p.id}>
                <Link href={`/inventario/${p.id}`} className="block h-full">
                  <Card
                    tono="lista"
                    className="h-full space-y-2 p-3.5 transition-transform hover:-translate-y-px"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="titulo-balance min-w-0 text-[15.5px] font-semibold">
                        {p.nombre}
                      </p>
                      <Chip tono={bajo ? 'peligro' : 'exito'}>
                        {bajo ? 'Stock bajo' : 'En rango'}
                      </Chip>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="num text-[12.5px] text-[var(--color-muted)]">
                        {montos
                          ? `${formatMoney(p.costo_unitario)} / ${p.unidad}`
                          : `mínimo ${p.stock_minimo} ${p.unidad}`}
                      </span>
                      <span
                        className={`num text-[18px] font-bold ${
                          bajo ? 'text-[var(--color-danger)]' : ''
                        }`}
                      >
                        {p.stock_actual} {p.unidad}
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
