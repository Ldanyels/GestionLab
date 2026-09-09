import Link from 'next/link'
import { listarLaboratorios } from '@/lib/plataforma/laboratorios'
import { FilaLaboratorio } from '@/components/plataforma/FilaLaboratorio'

export default async function PlataformaPage() {
  const laboratorios = await listarLaboratorios()
  const activos = laboratorios.filter((l) => l.estado === 'activo').length

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent)]">
            Plataforma
          </p>
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">
            Laboratorios
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
            {laboratorios.length} en total · {activos} con acceso
          </p>
        </div>
        <Link
          href="/plataforma/nuevo"
          className="inline-flex h-11 shrink-0 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </header>

      {laboratorios.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[15px] font-semibold">Todavía no hay laboratorios</p>
          <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
            Toca «+ Nuevo» para dar de alta el primero.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {laboratorios.map((l) => (
            <li key={l.id}>
              <FilaLaboratorio lab={l} />
            </li>
          ))}
        </ul>
      )}

      <Link href="/hoy" className="inline-block text-[13.5px] text-[var(--color-accent)]">
        ‹ Volver a mi laboratorio
      </Link>
    </section>
  )
}
