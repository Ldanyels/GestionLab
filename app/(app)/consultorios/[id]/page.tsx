import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getConsultorio } from '@/lib/consultorios/data'
import { getSessionPerfil } from '@/lib/auth'
import { veMontos } from '@/lib/permisos'
import { filasReporte } from '@/lib/reportes/data'
import { agruparPorConsultorio } from '@/lib/reportes/agrupar'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { DoctorForm } from '@/components/consultorios/DoctorForm'
import { DoctorRow } from '@/components/consultorios/DoctorRow'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { eliminarConsultorioAction, archivarConsultorioAction } from '../actions'

const enlace = 'text-[13.5px] font-semibold text-[var(--color-accent)]'

export default async function ConsultorioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [consultorio, perfil] = await Promise.all([getConsultorio(id), getSessionPerfil()])
  if (!consultorio) notFound()
  const montos = veMontos(perfil)

  const grupo = montos
    ? agruparPorConsultorio(await filasReporte({ consultorioId: id })).grupos[0]
    : undefined
  const trabajos = grupo?.doctores.reduce((s, d) => s + d.filas.length, 0) ?? 0

  return (
    <section className="space-y-4">
      <Link
        href="/consultorios"
        className="inline-block text-[13.5px] text-[var(--color-muted)]"
      >
        ‹ Consultorios
      </Link>

      <Card
        tono="destacada"
        colorLateral={colorConsultorio(consultorio.nombre)}
        className="space-y-3.5 p-4"
      >
        <div className="flex items-start gap-3">
          <Avatar nombre={consultorio.nombre} tamano={52} />
          <div className="min-w-0 flex-1">
            <h1 className="titulo-balance text-2xl font-bold leading-tight">
              {consultorio.nombre}
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-[var(--color-muted)]">
              {consultorio.contacto ?? 'Sin contacto'}
              {montos ? ` · ${trabajos} trabajo${trabajos === 1 ? '' : 's'}` : ''}
            </p>
          </div>
          {!consultorio.activo ? <Chip tono="neutro">Archivado</Chip> : null}
        </div>

        {montos || consultorio.notas ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
            {montos ? (
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-3 py-2">
                <p className="text-xs text-[var(--color-muted)]">Deuda vigente</p>
                <p
                  className={`num text-[19px] font-bold ${
                    (grupo?.saldo ?? 0) > 0.001
                      ? 'text-[var(--color-danger)]'
                      : 'text-[var(--color-success)]'
                  }`}
                >
                  {formatMoney(grupo?.saldo ?? 0)}
                </p>
              </div>
            ) : null}
            {consultorio.notas ? (
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-3 py-2">
                <p className="text-xs text-[var(--color-muted)]">Notas</p>
                <p className="text-[13.5px]">{consultorio.notas}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--color-border)] pt-3">
          <Link href={`/consultorios/${consultorio.id}/editar`} className={enlace}>
            Editar
          </Link>
          <form action={archivarConsultorioAction}>
            <input type="hidden" name="id" value={consultorio.id} />
            <input
              type="hidden"
              name="activo"
              value={consultorio.activo ? 'false' : 'true'}
            />
            <button type="submit" className={enlace}>
              {consultorio.activo ? 'Archivar' : 'Reactivar'}
            </button>
          </form>
          <span className="ml-auto">
            <ConfirmDialog
              action={eliminarConsultorioAction}
              fields={{ id: consultorio.id }}
              triggerLabel="Eliminar definitivo"
              triggerClassName="text-[13.5px] font-semibold text-[var(--color-danger)]"
              title="Eliminar definitivo"
              message={`Se borra ${consultorio.nombre}, sus doctores y su historial. ¿Prefieres archivar?`}
              confirmLabel="Sí, eliminar"
            />
          </span>
        </div>
      </Card>

      <div className="space-y-2.5">
        <h2 className="text-[17px] font-bold">Doctores</h2>
        {consultorio.doctores.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Este consultorio aún no tiene doctores.
          </p>
        ) : (
          <ul className="space-y-2">
            {consultorio.doctores.map((d) => (
              <DoctorRow key={d.id} doctor={d} />
            ))}
          </ul>
        )}
        <DoctorForm consultorioId={consultorio.id} />
      </div>
    </section>
  )
}
