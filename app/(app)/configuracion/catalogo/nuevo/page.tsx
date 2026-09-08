import { requireAdmin } from '@/lib/auth'
import { BackRow } from '@/components/ui/BackRow'
import { listCatalogo } from '@/lib/catalogo/data'
import { CatalogoForm } from '@/components/catalogo/CatalogoForm'
import { crearCatalogoAction } from '../actions'

export default async function NuevoCatalogoPage() {
  await requireAdmin()
  const items = await listCatalogo()
  const categorias = [...new Set(items.map((i) => i.categoria))]

  return (
    <section className="mx-auto max-w-[560px] space-y-4">
      <BackRow
        href="/configuracion/catalogo"
        titulo="Nuevo trabajo"
        migaDePan="Configuración"
      />
      <CatalogoForm
        action={crearCatalogoAction}
        categorias={categorias}
        submitLabel="Guardar"
      />
    </section>
  )
}
