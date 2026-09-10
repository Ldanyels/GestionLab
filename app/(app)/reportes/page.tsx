import Link from 'next/link'
import { BackRow } from '@/components/ui/BackRow'
import { Card } from '@/components/ui/Card'
import { KpiTile } from '@/components/ui/KpiTile'
import { requirePermiso } from '@/lib/auth'
import { veMontos, veMontosReportes } from '@/lib/permisos'
import { filasReporte } from '@/lib/reportes/data'
import { agruparPorConsultorio } from '@/lib/reportes/agrupar'
import { contarFilasPorCobro, filtrarFilasPorCobro } from '@/lib/reportes/cobro'
import { contarPorEstado } from '@/lib/trabajos/filtro'
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
    estado?: string
    periodo?: string
    pago?: string
    mostrar?: string
  }>
}) {
  const perfil = await requirePermiso('reportes')
  // `montos`: sus reportes salen con importes (admin o técnico autorizado).
  // `soloAdmin`: ve además los totales del laboratorio en pantalla.
  const montos = veMontosReportes(perfil)
  const soloAdmin = veMontos(perfil)
  const sp = await searchParams
  const f = resolverFiltros(sp)
  const [todas, opciones] = await Promise.all([filasReporte(f), opcionesFiltro()])
  const filas = filtrarFilasPorCobro(todas, f.pago)
  const { grupos, totales } = agruparPorConsultorio(filas)

  /*
    Los conteos se calculan sobre lo que los otros filtros ya dejaron pasar,
    para que ningún número prometa resultados que el filtro combinado no va a
    devolver. El de estado va sobre `todas` porque el estado ya se acotó en la
    consulta: si se contara sobre lo filtrado, el estado activo sería el único
    con un número distinto de cero.
  */
  const conteoEstado = contarPorEstado(
    todas.map((t) => ({ estado: t.estado as EstadoTrabajo })),
  )
  const conteoPago = contarFilasPorCobro(todas)
  const query = queryFiltros(f)

  return (
    <section className="space-y-4">
      <div>
        <BackRow
          href="/finanzas"
          migaDePan="Finanzas"
          titulo={
            !montos
              ? 'Trabajos por consultorio'
              : f.soloPendientes
                ? 'Pendiente por cobrar'
                : 'Reporte de trabajos'
          }
        />
        <p className="num mt-1 pl-[52px] text-[13px] text-[var(--color-muted)]">
          {etiquetaRango(f.desde, f.hasta)}
        </p>
      </div>

      <FiltrosReporte
        filtros={f}
        conteoEstado={conteoEstado}
        conteoPago={conteoPago}
        montos={montos}
        consultorios={opciones.consultorios}
        doctores={opciones.doctores}
      />

      {/*
        Resumen del periodo: solo para el administrador.

        Estos cuatro totales son la posición financiera agregada del
        laboratorio, no la cuenta de un doctor. El técnico con permiso de
        'reportes_montos' sigue emitiendo el PDF y el ticket con importes para
        entregárselos al doctor —eso no cambia—, y sigue viendo el detalle por
        consultorio y por doctor más abajo, que es el contenido del reporte que
        va a entregar. Lo que no ve es cuánto tiene el laboratorio por cobrar en
        total. Por eso el corte es `veMontos` (solo admin) y no
        `veMontosReportes` (admin o técnico autorizado).
      */}
      {soloAdmin ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
          <KpiTile
            etiqueta={f.soloPendientes ? 'Trabajos con deuda' : 'Trabajos'}
            valor={String(totales.trabajos)}
          />
          <KpiTile
            etiqueta="Monto final"
            valor={formatMoney(totales.facturado)}
            className="col-span-full sm:col-span-1"
          />
          <KpiTile
            etiqueta={f.soloPendientes ? 'Abonado a cuenta' : 'Pagado'}
            valor={formatMoney(totales.pagado)}
            className="col-span-full sm:col-span-1"
          />
          <KpiTile
            etiqueta="Por cobrar"
            valor={formatMoney(totales.saldo)}
            tono={totales.saldo > 0.001 ? 'peligro' : 'exito'}
            className="col-span-full sm:col-span-1"
          />
        </div>
      ) : null}

      <div className="flex gap-2">
        <a
          href={`/reportes/pdf?${query}`}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3 text-sm font-semibold text-[var(--color-accent-contrast)]"
        >
          PDF A4
        </a>
        <a
          href={`/reportes/ticket?${query}`}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold"
        >
          Ticket 80 mm
        </a>
      </div>

      {grupos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">Sin resultados</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            {f.soloPendientes
              ? 'Nadie tiene deuda pendiente en este rango.'
              : 'Prueba con otras fechas o quita los filtros.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {grupos.map((g) => (
            <Card
              key={g.consultorio_id}
              tono="lista"
              colorLateral={colorConsultorio(g.consultorio)}
              className="space-y-3 p-3.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="min-w-0 truncate text-base font-bold">{g.consultorio}</h2>
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
                  <ul className="space-y-1 border-l-2 border-[var(--color-border)] pl-3">
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
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
