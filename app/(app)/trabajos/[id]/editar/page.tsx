import Link from 'next/link'
import { notFound } from 'next/navigation'
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
      <div className="flex items-center gap-2">
        <Link href={`/trabajos/${id}`} className="text-[var(--color-muted)]">
          ‹
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Editar trabajo</h1>
      </div>
      <TrabajoForm
        action={editarTrabajoAction}
        doctores={doctores}
        tipos={tipos}
        trabajo={t}
        submitLabel="Guardar cambios"
      />
    </section>
  )
}
