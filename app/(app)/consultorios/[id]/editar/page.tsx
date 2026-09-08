import { notFound } from 'next/navigation'
import { BackRow } from '@/components/ui/BackRow'
import { getConsultorio } from '@/lib/consultorios/data'
import { ConsultorioForm } from '@/components/consultorios/ConsultorioForm'
import { editarConsultorioAction } from '../../actions'

export default async function EditarConsultorioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const consultorio = await getConsultorio(id)
  if (!consultorio) notFound()

  return (
    <section className="mx-auto max-w-[560px] space-y-4">
      <BackRow href={`/consultorios/${id}`} titulo="Editar consultorio" />
      <ConsultorioForm
        action={editarConsultorioAction}
        consultorio={consultorio}
        submitLabel="Guardar cambios"
      />
    </section>
  )
}
