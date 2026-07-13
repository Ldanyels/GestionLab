import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { ProductoForm } from '@/components/inventario/ProductoForm'
import { crearProductoAction } from '../actions'

export default async function NuevoProductoPage() {
  await requireAdmin()
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/inventario" className="text-[var(--color-muted)]">
          ‹
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Nuevo insumo</h1>
      </div>
      <ProductoForm action={crearProductoAction} submitLabel="Guardar" />
    </section>
  )
}
