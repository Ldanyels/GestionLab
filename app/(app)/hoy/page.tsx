import Link from 'next/link'
import { getSessionPerfil } from '@/lib/auth'
import { puede } from '@/lib/permisos'
import { listTrabajos } from '@/lib/trabajos/data'
import { listProductos } from '@/lib/inventario/data'
import { entregasDelDia, fechaLarga, hoyLima } from '@/lib/trabajos/agenda'
import { PagoChip } from '@/components/trabajos/PagoChip'

export default async function HoyPage() {
  const perfil = await getSessionPerfil()
  const veInventario = puede(perfil, 'inventario_ver')
  const [enCurso, productos] = await Promise.all([
    listTrabajos({ estado: 'en_curso' }),
    veInventario ? listProductos() : Promise.resolve([]),
  ])

  const hoy = hoyLima()
  // Solo el día actual: sin atrasados ni futuros (esos están en Trabajos).
  const deHoy = entregasDelDia(enCurso, hoy)
  const stockBajo = productos.filter((p) => p.stock_actual <= p.stock_minimo)

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Hoy</h1>
        <p className="text-sm text-[var(--color-muted)]">
          <span className="capitalize">{fechaLarga(hoy)}</span> ·{' '}
          {deHoy.length === 0
            ? 'sin entregas programadas'
            : `${deHoy.length} entrega${deHoy.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {veInventario && stockBajo.length > 0 ? (
        <Link
          href="/inventario"
          className="block rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-danger)]/8 p-3 text-sm"
        >
          ⚠️ {stockBajo.length} insumo{stockBajo.length === 1 ? '' : 's'} en stock bajo —
          toca para revisar.
        </Link>
      ) : null}

      <Link
        href="/trabajos/nuevo"
        className="flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] font-medium text-[var(--color-accent-contrast)]"
      >
        + Nuevo trabajo
      </Link>

      {deHoy.length === 0 ? (
        <div className="space-y-2 py-8 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            No hay entregas programadas para hoy.
          </p>
          <Link href="/trabajos" className="text-sm font-medium text-[var(--color-accent)]">
            Ver todos los trabajos →
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Entregas de hoy
          </h2>
          <ul className="space-y-2">
            {deHoy.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/trabajos/${t.id}`}
                  className="block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:border-[var(--color-accent)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">{t.tipo_nombre}</span>
                    <PagoChip saldo={t.saldo} />
                  </div>
                  <p className="mt-1 truncate text-sm text-[var(--color-muted)]">
                    {t.doctor_nombre} · {t.consultorio_nombre}
                    {t.paciente_nombre ? ` · ${t.paciente_nombre}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
