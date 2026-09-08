import { requireAdmin } from '@/lib/auth'
import { BackRow } from '@/components/ui/BackRow'
import { TrabajadorForm } from '@/components/trabajadores/TrabajadorForm'
import { crearTrabajadorAction } from '../actions'

export default async function NuevoTrabajadorPage() {
  await requireAdmin()
  return (
    <section className="mx-auto max-w-[560px] space-y-4">
      <BackRow
        href="/configuracion/trabajadores"
        titulo="Nuevo trabajador"
        migaDePan="Configuración"
      />
      <TrabajadorForm action={crearTrabajadorAction} submitLabel="Guardar" />
    </section>
  )
}
