import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  catalogoDeLaboratorio,
  resumenDeLaboratorio,
} from '@/lib/plataforma/laboratorio-detalle'
import { CatalogoDeLaboratorio } from '@/components/plataforma/CatalogoDeLaboratorio'
import { corregirPrecioBaseAction, crearItemDeCatalogoAction } from '../actions'

export default async function CatalogoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [resumen, items] = await Promise.all([
    resumenDeLaboratorio(id),
    catalogoDeLaboratorio(id),
  ])
  if (!resumen) notFound()

  return (
    <section className="space-y-4">
      <header>
        <Link href={`/plataforma/${id}`} className="text-[13.5px] text-[var(--color-accent)]">
          ‹ {resumen.laboratorio.nombre}
        </Link>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-[-0.02em]">
          Catálogo
        </h1>
        <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
          {items.length} {items.length === 1 ? 'tipo de trabajo' : 'tipos de trabajo'}
        </p>
      </header>

      <CatalogoDeLaboratorio
        labId={id}
        items={items}
        corregirPrecio={corregirPrecioBaseAction}
        crear={crearItemDeCatalogoAction}
      />
    </section>
  )
}
