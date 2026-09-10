import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDoctor } from '@/lib/consultorios/data'
import { getSessionPerfil } from '@/lib/auth'
import { veMontos } from '@/lib/permisos'
import { listTrabajos } from '@/lib/trabajos/data'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import { TrabajoCard } from '@/components/trabajos/TrabajoCard'
import { hoyLima } from '@/lib/trabajos/agenda'

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [doctor, perfil] = await Promise.all([getDoctor(id), getSessionPerfil()])
  if (!doctor) notFound()
  const montos = veMontos(perfil)
  // En la zona de Lima: con el reloj del servidor, de noche marcaría atrasado
  // un trabajo que vence hoy.
  const hoy = hoyLima()
  const trabajos = await listTrabajos({ doctorId: id })
  const porCobrar =
    Math.round(trabajos.reduce((s, t) => s + Math.max(0, t.saldo), 0) * 100) / 100

  return (
    <section className="space-y-4">
      <Link
        href={`/consultorios/${doctor.consultorio_id}`}
        className="inline-block text-[13.5px] text-[var(--color-muted)]"
      >
        ‹ {doctor.consultorio_nombre}
      </Link>

      <div>
        <h1 className="flex items-center gap-2.5 text-[26px] font-bold leading-tight tracking-[-0.03em]">
          <span
            aria-hidden
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: colorConsultorio(doctor.consultorio_nombre) }}
          />
          <span className="min-w-0">{doctor.nombre}</span>
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">
          {trabajos.length} trabajo{trabajos.length === 1 ? '' : 's'}
          {montos ? ` · ${formatMoney(porCobrar)} por cobrar` : ''}
        </p>
      </div>

      <Link
        href={`/trabajos/nuevo?doctor=${doctor.id}`}
        className="flex h-[52px] items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-accent)] text-base font-semibold text-[var(--color-accent-contrast)] shadow-[0_6px_18px_var(--color-accent-glow)] transition-transform active:scale-[0.99]"
      >
        + Nuevo trabajo para {doctor.nombre}
      </Link>

      {trabajos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">Sin trabajos</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            Toca el botón para registrar el primero.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {trabajos.map((t) => (
            <li key={t.id}>
              <TrabajoCard trabajo={t} montos={montos} hoy={hoy} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
