import { notFound } from 'next/navigation'
import { BackRow } from '@/components/ui/BackRow'
import { requireAdmin } from '@/lib/auth'
import { getProducto } from '@/lib/inventario/data'
import { ProductoForm } from '@/components/inventario/ProductoForm'
import { editarProductoAction } from '../../actions'

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const p = await getProducto(id)
  if (!p) notFound()

  return (
    <section className="mx-auto max-w-[560px] space-y-4">
      <BackRow href={`/inventario/${id}`} titulo="Editar insumo" />
      <ProductoForm
        action={editarProductoAction}
        producto={p}
        submitLabel="Guardar cambios"
      />
    </section>
  )
}
