import Link from 'next/link'
import { notFound } from 'next/navigation'
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
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href={`/inventario/${id}`} className="text-[var(--color-muted)]">
          ‹
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Editar insumo</h1>
      </div>
      <ProductoForm
        action={editarProductoAction}
        producto={p}
        submitLabel="Guardar cambios"
      />
    </section>
  )
}
