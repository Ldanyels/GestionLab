import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getCatalogoItem, listCatalogo } from '@/lib/catalogo/data'
import { CatalogoForm } from '@/components/catalogo/CatalogoForm'
import { editarCatalogoAction } from '../../actions'

export default async function EditarCatalogoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const [item, items] = await Promise.all([getCatalogoItem(id), listCatalogo()])
  if (!item) notFound()
  const categorias = [...new Set(items.map((i) => i.categoria))]

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/configuracion/catalogo/${id}`}
          className="text-[var(--color-muted)]"
        >
          ‹
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Editar trabajo</h1>
      </div>
      <CatalogoForm
        action={editarCatalogoAction}
        item={item}
        categorias={categorias}
        submitLabel="Guardar cambios"
      />
    </section>
  )
}
