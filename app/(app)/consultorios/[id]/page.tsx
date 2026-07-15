import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getConsultorio } from '@/lib/consultorios/data'
import { DoctorForm } from '@/components/consultorios/DoctorForm'
import { DoctorRow } from '@/components/consultorios/DoctorRow'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  eliminarConsultorioAction,
  archivarConsultorioAction,
} from '../actions'

export default async function ConsultorioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const consultorio = await getConsultorio(id)
  if (!consultorio) notFound()

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href="/consultorios" className="text-sm text-[var(--color-muted)]">
            ‹ Consultorios
          </Link>
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {consultorio.nombre}
          </h1>
          {consultorio.contacto ? (
            <p className="text-sm text-[var(--color-muted)]">{consultorio.contacto}</p>
          ) : null}
          {!consultorio.activo ? (
            <span className="mt-1 inline-block rounded-full bg-[var(--color-muted)]/15 px-2 py-0.5 text-xs text-[var(--color-muted)]">
              Archivado
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Link
            href={`/consultorios/${consultorio.id}/editar`}
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
          >
            Editar
          </Link>
          <form action={archivarConsultorioAction}>
            <input type="hidden" name="id" value={consultorio.id} />
            <input type="hidden" name="activo" value={consultorio.activo ? 'false' : 'true'} />
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
            >
              {consultorio.activo ? 'Archivar' : 'Reactivar'}
            </button>
          </form>
          <ConfirmDialog
            action={eliminarConsultorioAction}
            fields={{ id: consultorio.id }}
            triggerLabel="Eliminar definitivo"
            triggerClassName="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm text-[var(--color-danger)]"
            title="Eliminar definitivo"
            message={`Esto borra "${consultorio.nombre}" y TODO su historial: doctores, trabajos, etapas y pagos. No se puede deshacer. ¿Prefieres archivar en su lugar? Si estás seguro, confirma.`}
            confirmLabel="Sí, eliminar todo"
          />
        </div>
      </div>

      {consultorio.notas ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
          {consultorio.notas}
        </p>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Doctores</h2>
        {consultorio.doctores.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Aún no hay doctores en este consultorio.
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
