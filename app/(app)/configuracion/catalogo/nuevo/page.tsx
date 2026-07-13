import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listCatalogo } from '@/lib/catalogo/data'
import { CatalogoForm } from '@/components/catalogo/CatalogoForm'
import { crearCatalogoAction } from '../actions'

export default async function NuevoCatalogoPage() {
  await requireAdmin()
  const items = await listCatalogo()
  const categorias = [...new Set(items.map((i) => i.categoria))]

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/configuracion/catalogo" className="text-[var(--color-muted)]">
          ‹
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Nuevo trabajo</h1>
      </div>
      <CatalogoForm
        action={crearCatalogoAction}
        categorias={categorias}
        submitLabel="Guardar"
      />
    </section>
  )
}
