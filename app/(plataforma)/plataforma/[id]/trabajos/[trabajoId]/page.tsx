import Link from 'next/link'
import { notFound } from 'next/navigation'
import { trabajoParaCorregir } from '@/lib/plataforma/laboratorio-detalle'
import { CorregirTrabajo } from '@/components/plataforma/CorregirTrabajo'
import { borrarAbonoDeLaboratorioAction, corregirTrabajoAction } from '../../actions'

export default async function CorregirTrabajoPage({
  params,
}: {
  params: Promise<{ id: string; trabajoId: string }>
}) {
  const { id, trabajoId } = await params
  // Si el trabajo no es de este laboratorio, el cliente acotado no lo
  // encuentra: la barrera es la consulta, no una comprobación aparte.
  const datos = await trabajoParaCorregir(id, trabajoId)
  if (!datos) notFound()

  return (
    <div className="space-y-4">
      <Link
        href={`/plataforma/${id}`}
        className="inline-block text-[13.5px] text-[var(--color-muted)]"
      >
        ‹ Volver al laboratorio
      </Link>
      <CorregirTrabajo
        labId={id}
        datos={datos}
        corregir={corregirTrabajoAction}
        borrarAbono={borrarAbonoDeLaboratorioAction}
      />
    </div>
  )
}
