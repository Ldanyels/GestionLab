import { notFound } from 'next/navigation'
import { BackRow } from '@/components/ui/BackRow'
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
    <section className="mx-auto max-w-[560px] space-y-4">
      <BackRow
        href={`/configuracion/catalogo/${id}`}
        titulo="Editar trabajo"
        migaDePan="Configuración"
      />
      <CatalogoForm
        action={editarCatalogoAction}
        item={item}
        categorias={categorias}
        submitLabel="Guardar cambios"
      />
    </section>
  )
}
