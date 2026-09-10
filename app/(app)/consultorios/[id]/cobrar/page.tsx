import { notFound } from 'next/navigation'
import { BackRow } from '@/components/ui/BackRow'
import { requirePermiso } from '@/lib/auth'
import { getConsultorio } from '@/lib/consultorios/data'
import { trabajosCobrablesDeConsultorio } from '@/lib/abonos/data'
import { hoyLima } from '@/lib/trabajos/agenda'
import { FormularioDeCobro } from '@/components/abonos/FormularioDeCobro'
import { registrarCobroAction } from './actions'

/**
 * Registrar un pago de un consultorio.
 *
 * Existe porque el pago no llega por trabajo: el consultorio es intermediario
 * y paga por los pacientes que le pagaron a él. Registrar eso trabajo por
 * trabajo obligaba a buscar cada uno y repartir el importe a mano —doce veces,
 * en el caso de Arte oral— y por eso no se hacía.
 */
export default async function CobrarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermiso('abonos_registrar')
  const { id } = await params
  const [consultorio, trabajos] = await Promise.all([
    getConsultorio(id),
    trabajosCobrablesDeConsultorio(id),
  ])
  if (!consultorio) notFound()

  return (
    <section className="space-y-4">
      <BackRow href={`/consultorios/${id}`} titulo="Registrar pago" />

      {trabajos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[15px] font-semibold">{consultorio.nombre} no debe nada</p>
          <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
            Todos sus trabajos están cobrados.
          </p>
        </div>
      ) : (
        <FormularioDeCobro
          consultorioId={id}
          consultorio={consultorio.nombre}
          trabajos={trabajos}
          hoy={hoyLima()}
          action={registrarCobroAction}
        />
      )}
    </section>
  )
}
