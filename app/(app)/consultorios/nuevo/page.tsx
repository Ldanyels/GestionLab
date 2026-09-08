import { BackRow } from '@/components/ui/BackRow'
import { ConsultorioForm } from '@/components/consultorios/ConsultorioForm'
import { crearConsultorioAction } from '../actions'

export default function NuevoConsultorioPage() {
  return (
    <section className="mx-auto max-w-[560px] space-y-4">
      <BackRow href="/consultorios" titulo="Nuevo consultorio" />
      <ConsultorioForm action={crearConsultorioAction} submitLabel="Guardar" />
    </section>
  )
}
