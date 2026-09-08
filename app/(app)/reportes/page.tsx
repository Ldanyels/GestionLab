import Link from 'next/link'
import { requirePermiso } from '@/lib/auth'
import { veMontosReportes } from '@/lib/permisos'
import { filasReporte } from '@/lib/reportes/data'
import { agruparPorConsultorio, soloConSaldo } from '@/lib/reportes/agrupar'
import { resolverFiltros, etiquetaRango, queryFiltros } from '@/lib/reportes/filtros'
import { opcionesFiltro } from '@/lib/reportes/opciones'
import { FiltrosReporte } from '@/components/reportes/FiltrosReporte'
import { colorConsultorio } from '@/lib/consultorios/color'
import { ETIQUETA_TRABAJO, type EstadoTrabajo } from '@/lib/trabajos/estado'
import { formatMoney } from '@/lib/format'

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{
    desde?: string
    hasta?: string
    consultorio?: string
    doctor?: string
    mostrar?: string
  }>
}) {
  const perfil = await requirePermiso('reportes')
  const montos = veMontosReportes(perfil)
  const sp = await searchParams
  const f = resolverFiltros(sp)
  const [todas, opciones] = await Promise.all([filasReporte(f), opcionesFiltro()])
  const filas = f.soloPendientes ? soloConSaldo(todas) : todas
  const { grupos, totales } = agruparPorConsultorio(filas)
  const query = queryFiltros(f)

  return (
    <section className="space-y-4">
      <div>
        <Link href="/finanzas" className="text-sm text-[var(--color-muted)]">
          ‹ Finanzas
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">
          {!montos
            ? 'Trabajos por consultorio'
            : f.soloPendientes
              ? 'Pendiente por cobrar'
              : 'Reporte de trabajos'}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {etiquetaRango(f.desde, f.hasta)}
        </p>
      </div>

      <FiltrosReporte
        desde={f.desde}
        hasta={f.hasta}
        consultorioId={f.consultorioId}
        doctorId={f.doctorId}
        soloPendientes={f.soloPendientes}
        consultorios={opciones.consultorios}
        doctores={opciones.doctores}
      />

      {/* Resumen del periodo. Sin permiso de finanzas, solo el conteo. */}
      <div className={montos ? 'grid grid-cols-2 gap-3' : ''}>
        <Tile
          label={f.soloPendientes ? 'Trabajos con deuda' : 'Trabajos'}
          valor={String(totales.trabajos)}
        />
        {montos ? (
          <>
            <Tile label="Monto final" valor={formatMoney(totales.facturado)} />
            <Tile
              label={f.soloPendientes ? 'Abonado a cuenta' : 'Pagado'}
              valor={formatMoney(totales.pagado)}
            />
            <Tile
              label="Por cobrar"
              valor={formatMoney(totales.saldo)}
              className={
                totales.saldo > 0.001
                  ? 'text-[var(--color-danger)]'
                  : 'text-[var(--color-success)]'
              }
            />
          </>
        ) : null}
      </div>

      <div className="flex gap-2">
        <a
          href={`/reportes/pdf?${query}`}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3 text-sm font-medium text-[var(--color-accent-contrast)]"
        >
          PDF A4
        </a>
        <a
          href={`/reportes/ticket?${query}`}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
        >
          Ticket 80mm
        </a>
      </div>

      {grupos.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          {f.soloPendientes
            ? 'Nadie tiene deuda pendiente en este rango.'
            : 'No hay trabajos en este rango. Prueba con otras fechas.'}
        </p>
      ) : (
        <div className="space-y-4">
          {grupos.map((g) => (
            <div
              key={g.consultorio_id}
              style={{ borderLeftColor: colorConsultorio(g.consultorio) }}
              className="space-y-3 rounded-[var(--radius-md)] border border-l-4 border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="min-w-0 truncate font-medium">{g.consultorio}</h2>
                <span
                  className={`num shrink-0 font-semibold ${
                    g.saldo > 0.001
                      ? 'text-[var(--color-danger)]'
                      : 'text-[var(--color-success)]'
                  }`}
                >
                  {montos
                    ? formatMoney(g.saldo)
                    : `${g.doctores.reduce((s, d) => s + d.filas.length, 0)} trab.`}
                </span>
              </div>

              {g.doctores.map((d) => (
                <div key={d.doctor_id} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <Link
                      href={`/doctores/${d.doctor_id}`}
                      className="min-w-0 truncate text-[var(--color-accent)]"
                    >
                      {d.doctor}
                    </Link>
                    <span className="num shrink-0 text-[var(--color-muted)]">
                      {montos
                        ? `${formatMoney(d.pagado)} de ${formatMoney(d.facturado)}`
                        : `${d.filas.length} trab.`}
                    </span>
                  </div>
                  <ul className="space-y-1 border-l border-[var(--color-border)] pl-3">
                    {d.filas.map((t) => {
                      const saldo = Math.round((t.total - t.pagado) * 100) / 100
                      return (
                        <li key={t.id}>
                          <Link
                            href={`/trabajos/${t.id}`}
                            className="flex items-baseline justify-between gap-2 text-sm"
                          >
                            <span className="min-w-0 truncate text-[var(--color-muted)]">
                              {t.fecha_ingreso.slice(5)} · {t.resumen}
                              {t.paciente ? ` · ${t.paciente}` : ''}
                            </span>
                            <span
                              className={`shrink-0 text-xs ${
                                montos
                                  ? `num ${saldo > 0.001 ? 'text-[var(--color-danger)]' : ''}`
                                  : 'text-[var(--color-muted)]'
                              }`}
                            >
                              {montos
                                ? formatMoney(saldo)
                                : (ETIQUETA_TRABAJO[t.estado as EstadoTrabajo] ?? t.estado)}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Tile({
  label,
  valor,
  className = '',
}: {
  label: string
  valor: string
  className?: string
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className={`num text-xl font-semibold ${className}`}>{valor}</p>
    </div>
  )
}
