import Link from 'next/link'
import { getSessionPerfil } from '@/lib/auth'
import { listTrabajos } from '@/lib/trabajos/data'
import { listProductos } from '@/lib/inventario/data'
import { PagoChip } from '@/components/trabajos/PagoChip'

/** Fecha de hoy en Perú (YYYY-MM-DD), estable sin importar la zona del servidor. */
function hoyLima(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
}

export default async function HoyPage() {
  const perfil = await getSessionPerfil()
  const esAdmin = perfil?.rol === 'admin'
  const [enCurso, productos] = await Promise.all([
    listTrabajos({ estado: 'en_curso' }),
    esAdmin ? listProductos() : Promise.resolve([]),
  ])

  const hoy = hoyLima()
  const stockBajo = productos.filter((p) => p.stock_actual <= p.stock_minimo)

  // Ordenar: vencidos y "vence hoy" primero.
  const ordenados = [...enCurso].sort((a, b) => {
    const va = a.fecha_entrega && a.fecha_entrega <= hoy ? 0 : 1
    const vb = b.fecha_entrega && b.fecha_entrega <= hoy ? 0 : 1
    return va - vb
  })

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Hoy</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Hola, {perfil?.nombre}. Tienes {enCurso.length} trabajo
          {enCurso.length === 1 ? '' : 's'} en curso.
        </p>
      </div>

      {esAdmin && stockBajo.length > 0 ? (
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

      {ordenados.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">
          No hay trabajos en curso.
        </p>
      ) : (
        <ul className="space-y-2">
          {ordenados.map((t) => {
            const vencido = t.fecha_entrega && t.fecha_entrega < hoy
            const venceHoy = t.fecha_entrega === hoy
            return (
              <li key={t.id}>
                <Link
                  href={`/trabajos/${t.id}`}
                  className="block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:border-[var(--color-accent)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">{t.tipo_nombre}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {vencido ? (
                        <span className="rounded-full bg-[var(--color-danger)]/12 px-2 py-0.5 text-xs font-medium text-[var(--color-danger)]">
                          Vencido
                        </span>
                      ) : venceHoy ? (
                        <span className="rounded-full bg-[#d97706]/12 px-2 py-0.5 text-xs font-medium text-[#b45309] dark:text-[#f59e0b]">
                          Vence hoy
                        </span>
                      ) : null}
                      <PagoChip saldo={t.saldo} />
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-[var(--color-muted)]">
                    {t.doctor_nombre} · {t.consultorio_nombre}
                    {t.paciente_nombre ? ` · ${t.paciente_nombre}` : ''}
                    {t.fecha_entrega ? ` · entrega ${t.fecha_entrega}` : ''}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
