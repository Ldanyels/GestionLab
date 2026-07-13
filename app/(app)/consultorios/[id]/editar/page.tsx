import Link from 'next/link'
import { notFound } from 'next/navigation'
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
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href={`/consultorios/${id}`} className="text-[var(--color-muted)]">
          ‹
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Editar consultorio</h1>
      </div>
      <ConsultorioForm
        action={editarConsultorioAction}
        consultorio={consultorio}
        submitLabel="Guardar cambios"
      />
    </section>
  )
}
