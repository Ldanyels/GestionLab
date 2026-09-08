import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getCatalogoItem } from '@/lib/catalogo/data'
import { formatMoney } from '@/lib/format'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
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
    <section className="mx-auto max-w-[620px] space-y-4">
      <Link
        href="/configuracion/catalogo"
        className="inline-block text-[13.5px] text-[var(--color-muted)]"
      >
        ‹ Catálogo
      </Link>

      <Card tono="destacada" className="space-y-3.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              {item.categoria}
            </p>
            <h1 className="titulo-balance text-2xl font-bold leading-tight">
              {item.nombre}
            </h1>
            <p className="num mt-1 text-[19px] font-bold">
              {formatMoney(item.precio_base)}
              {item.variable_etiqueta ? (
                <span className="text-[13px] font-normal text-[var(--color-muted)]">
                  {' '}
                  + {formatMoney(item.variable_precio_unitario ?? 0)} /{' '}
                  {item.variable_etiqueta}
                </span>
              ) : null}
            </p>
          </div>
          {!item.activo ? <Chip tono="neutro">Archivado</Chip> : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--color-border)] pt-3">
          <Link
            href={`/configuracion/catalogo/${item.id}/editar`}
            className="text-[13.5px] font-semibold text-[var(--color-accent)]"
          >
            Editar
          </Link>
          <form action={archivarCatalogoAction}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="activo" value={item.activo ? 'false' : 'true'} />
            <button
              type="submit"
              className="text-[13.5px] font-semibold text-[var(--color-accent)]"
            >
              {item.activo ? 'Archivar' : 'Reactivar'}
            </button>
          </form>
          <span className="ml-auto">
            <ConfirmDialog
              action={eliminarCatalogoAction}
              fields={{ id: item.id }}
              triggerLabel="Eliminar definitivo"
              triggerClassName="text-[13.5px] font-semibold text-[var(--color-danger)]"
              title="Eliminar definitivo"
              message={`Se borra «${item.nombre}», sus etapas, su receta y TODOS los trabajos de este tipo. No se puede deshacer. ¿Prefieres archivar?`}
              confirmLabel="Sí, eliminar todo"
            />
          </span>
        </div>
      </Card>

      <EtapasEditor catalogoId={item.id} etapas={item.etapas} />

      <RecetaEditor
        catalogoId={item.id}
        receta={receta}
        productos={productos.map((p) => ({ id: p.id, nombre: p.nombre, unidad: p.unidad }))}
      />
    </section>
  )
}
