import { requireAdmin } from '@/lib/auth'
import { BackRow } from '@/components/ui/BackRow'
import { ProductoForm } from '@/components/inventario/ProductoForm'
import { crearProductoAction } from '../actions'

export default async function NuevoProductoPage() {
  await requireAdmin()
  return (
    <section className="mx-auto max-w-[560px] space-y-4">
      <BackRow href="/inventario" titulo="Nuevo insumo" />
      <ProductoForm action={crearProductoAction} submitLabel="Guardar" />
    </section>
  )
}
