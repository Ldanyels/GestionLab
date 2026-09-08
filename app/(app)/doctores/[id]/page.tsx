import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDoctor } from '@/lib/consultorios/data'
import { listTrabajos } from '@/lib/trabajos/data'
import { EstadoBadge } from '@/components/trabajos/EstadoBadge'
import { PagoChip } from '@/components/trabajos/PagoChip'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const doctor = await getDoctor(id)
  if (!doctor) notFound()
  const trabajos = await listTrabajos({ doctorId: id })
  const enCurso = trabajos.filter((t) => t.estado === 'en_curso').length
  const color = colorConsultorio(doctor.consultorio_nombre)

  return (
    <section className="space-y-4">
      <div>
        <Link
          href={`/consultorios/${doctor.consultorio_id}`}
          className="text-sm text-[var(--color-muted)]"
        >
          ‹ {doctor.consultorio_nombre}
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <span
            aria-hidden
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          {doctor.nombre}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {trabajos.length} trabajo{trabajos.length === 1 ? '' : 's'} · {enCurso} en curso
        </p>
      </div>

      <Link
        href={`/trabajos/nuevo?doctor=${doctor.id}`}
        className="flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] font-medium text-[var(--color-accent-contrast)]"
      >
        + Nuevo trabajo para {doctor.nombre}
      </Link>

      {trabajos.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          Este doctor aún no tiene trabajos. Toca el botón para crear el primero.
        </p>
      ) : (
        <ul className="space-y-2">
          {trabajos.map((t) => (
            <li key={t.id}>
              <Link
                href={`/trabajos/${t.id}`}
                className="block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:border-[var(--color-accent)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">{t.tipo_nombre}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <EstadoBadge estado={t.estado} />
                    <PagoChip saldo={t.saldo} />
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-sm text-[var(--color-muted)]">
                  <span className="min-w-0 truncate">
                    {t.paciente_nombre ?? 'Sin paciente'}
                    {t.pieza ? ` · pza ${t.pieza}` : ''}
                    {t.fecha_entrega ? ` · entrega ${t.fecha_entrega}` : ''}
                  </span>
                  <span className="num shrink-0">{formatMoney(t.precio_acordado)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
