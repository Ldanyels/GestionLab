import { notFound } from 'next/navigation'
import { BackRow } from '@/components/ui/BackRow'
import { requirePermiso } from '@/lib/auth'
import { getConsultorio } from '@/lib/consultorios/data'
import { trabajosCobrablesDeConsultorio } from '@/lib/abonos/data'
import {
  ESTADOS_COBRABLES,
  ETIQUETA_ESTADO_COBRABLE,
  porEstadoCobrable,
  resolverEstadoCobrable,
} from '@/lib/abonos/cobro'
import Link from 'next/link'
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
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ estado?: string }>
}) {
  await requirePermiso('abonos_registrar')
  const { id } = await params
  const [consultorio, todos, sp] = await Promise.all([
    getConsultorio(id),
    trabajosCobrablesDeConsultorio(id),
    searchParams,
  ])
  if (!consultorio) notFound()

  /*
    El consultorio paga por lo que ya recibió.

    Mezclar lo entregado con lo que sigue en el taller obliga a distinguirlos a
    ojo entre doce líneas, y ahí es donde se marca uno de más. El filtro vive en
    la URL para que la pantalla se pueda compartir y el botón de atrás lo
    deshaga.
  */
  const estado = resolverEstadoCobrable(sp.estado)
  const { visibles, conteo } = porEstadoCobrable(todos, estado)

  return (
    <section className="space-y-4">
      <BackRow href={`/consultorios/${id}`} titulo="Registrar pago" />

      {todos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[15px] font-semibold">{consultorio.nombre} no debe nada</p>
          <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
            Todos sus trabajos están cobrados.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1">
            {ESTADOS_COBRABLES.map((e) => {
              const activo = estado === e
              return (
                <Link
                  key={e}
                  href={e === 'todos' ? `/consultorios/${id}/cobrar` : `/consultorios/${id}/cobrar?estado=${e}`}
                  aria-current={activo ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1 text-[13px] transition-colors ${
                    activo
                      ? 'font-semibold text-[var(--color-accent)] underline decoration-2 underline-offset-[5px]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {ETIQUETA_ESTADO_COBRABLE[e]}
                  <span className="num text-[11.5px] opacity-65">{conteo[e]}</span>
                </Link>
              )
            })}
          </div>

          {visibles.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-8 text-center">
              <p className="text-[15px] font-semibold">
                Nada por cobrar en {ETIQUETA_ESTADO_COBRABLE[estado].toLowerCase()}
              </p>
              <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
                {consultorio.nombre} sí debe en los otros estados.
              </p>
            </div>
          ) : (
            <FormularioDeCobro
              // Cambiar de filtro rehace el formulario desde cero: conservar lo
              // marcado de otra lista enviaría importes de trabajos que ya no
              // se ven.
              key={estado}
              consultorioId={id}
              consultorio={consultorio.nombre}
              trabajos={visibles}
              hoy={hoyLima()}
              action={registrarCobroAction}
            />
          )}
        </>
      )}
    </section>
  )
}
