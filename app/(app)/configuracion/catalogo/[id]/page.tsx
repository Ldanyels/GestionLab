import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getCatalogoItem } from '@/lib/catalogo/data'
import { formatMoney } from '@/lib/format'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EtapasEditor } from '@/components/catalogo/EtapasEditor'
import { eliminarCatalogoAction } from '../actions'

export default async function CatalogoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const item = await getCatalogoItem(id)
  if (!item) notFound()

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
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/configuracion/catalogo/${item.id}/editar`}
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
          >
            Editar
          </Link>
          <ConfirmDialog
            action={eliminarCatalogoAction}
            fields={{ id: item.id }}
            triggerLabel="Eliminar"
            triggerClassName="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm text-[var(--color-danger)]"
            title="Eliminar trabajo"
            message={`¿Eliminar "${item.nombre}" y sus etapas? Esta acción no se puede deshacer.`}
          />
        </div>
      </div>

      <EtapasEditor catalogoId={item.id} etapas={item.etapas} />
    </section>
  )
}
