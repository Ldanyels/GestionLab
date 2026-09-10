import { notFound } from 'next/navigation'
import { BackRow } from '@/components/ui/BackRow'
import { getTrabajo } from '@/lib/trabajos/data'
import { listDoctoresConConsultorio } from '@/lib/consultorios/data'
import { listCatalogo } from '@/lib/catalogo/data'
import { TrabajoForm } from '@/components/trabajos/TrabajoForm'
import { editarTrabajoAction } from '../../actions'

export default async function EditarTrabajoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [t, doctores, tipos] = await Promise.all([
    getTrabajo(id),
    listDoctoresConConsultorio(),
    listCatalogo(),
  ])
  if (!t) notFound()

  return (
    <section className="space-y-4">
      <BackRow href={`/trabajos/${id}`} titulo="Editar trabajo" />
      <TrabajoForm
        action={editarTrabajoAction}
        doctores={doctores}
        tipos={tipos}
        trabajo={t}
        submitLabel="Guardar cambios"
        // Al editar, el plazo se cuenta desde el ingreso real del trabajo: «3
        // días» de un trabajo que entró el lunes sigue siendo el jueves.
        fechaIngreso={t.fecha_ingreso}
      />
    </section>
  )
}
