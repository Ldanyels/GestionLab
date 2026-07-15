import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getCatalogoItem } from '@/lib/catalogo/data'
import { formatMoney } from '@/lib/format'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EtapasEditor } from '@/components/catalogo/EtapasEditor'
import { RecetaEditor } from '@/components/catalogo/RecetaEditor'
import { listReceta } from '@/lib/recetas/data'
import { listProductos } from '@/lib/inventario/data'
import { eliminarCatalogoAction, archivarCatalogoAction } from '../actions'

export default async function CatalogoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const item = await getCatalogoItem(id)
  if (!item) notFound()
  const [receta, productos] = await Promise.all([listReceta(id), listProductos()])

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href="/configuracion/catalogo"
            className="text-sm text-[var(--color-muted)]"
          >
            ‹ Catálogo
          </Link>
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {item.nombre}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">{item.categoria}</p>
          <p className="mt-1 text-sm tabular-nums">
            {formatMoney(item.precio_base)}
            {item.variable_etiqueta ? (
              <span className="text-[var(--color-muted)]">
                {' '}
                + {formatMoney(item.variable_precio_unitario ?? 0)} ×{' '}
                {item.variable_etiqueta}
              </span>
            ) : null}
          </p>
          {!item.activo ? (
            <span className="mt-1 inline-block rounded-full bg-[var(--color-muted)]/15 px-2 py-0.5 text-xs text-[var(--color-muted)]">
              Archivado
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Link
            href={`/configuracion/catalogo/${item.id}/editar`}
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
          >
            Editar
          </Link>
          <form action={archivarCatalogoAction}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="activo" value={item.activo ? 'false' : 'true'} />
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
            >
              {item.activo ? 'Archivar' : 'Reactivar'}
            </button>
          </form>
          <ConfirmDialog
            action={eliminarCatalogoAction}
            fields={{ id: item.id }}
            triggerLabel="Eliminar definitivo"
            triggerClassName="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm text-[var(--color-danger)]"
            title="Eliminar definitivo"
            message={`Esto borra "${item.nombre}", sus etapas, receta y TODOS los trabajos de este tipo. No se puede deshacer. ¿Prefieres archivar? Si estás seguro, confirma.`}
            confirmLabel="Sí, eliminar todo"
          />
        </div>
      </div>

      <EtapasEditor catalogoId={item.id} etapas={item.etapas} />

      <RecetaEditor
        catalogoId={item.id}
        receta={receta}
        productos={productos.map((p) => ({ id: p.id, nombre: p.nombre, unidad: p.unidad }))}
      />
    </section>
  )
}
