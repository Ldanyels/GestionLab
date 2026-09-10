'use client'

import Link from 'next/link'
import { Segmentado } from '@/components/ui/Segmentado'
import { enlaceReporte, type FiltrosResueltos } from '@/lib/reportes/filtros'
import {
  ETIQUETA_PERIODO_REPORTE,
  PERIODOS_REPORTE,
  type PeriodoReporte,
} from '@/lib/reportes/periodo'
import { campoFechaDe, ETIQUETA_CAMPO_FECHA } from '@/lib/trabajos/periodo'
import { ETIQUETA_FILTRO_PAGO, type FiltroPago } from '@/lib/trabajos/pago'
import type { ConteoEstados } from '@/lib/trabajos/filtro'
import type { EstadoTrabajo } from '@/lib/trabajos/estado'
import type { ConsultorioOpcion, DoctorOpcion } from '@/lib/reportes/opciones'

const ESTADOS: { clave: string; etiqueta: string; estado?: EstadoTrabajo }[] = [
  { clave: 'todos', etiqueta: 'Todos' },
  { clave: 'en_curso', etiqueta: 'En curso', estado: 'en_curso' },
  { clave: 'cerrado', etiqueta: 'Cerrados', estado: 'cerrado' },
  { clave: 'entregado', etiqueta: 'Entregados', estado: 'entregado' },
]

/** Los dos estados de cobro. Ninguno activo significa "cualquiera". */
const COBROS: FiltroPago[] = ['por_cobrar', 'pagados']

const campo =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'
const etiquetaCampo = 'text-xs text-[var(--color-muted)]'

/**
 * Cambiar de consultorio suelta el doctor elegido.
 *
 * Sin esto, la combinación «consultorio nuevo + doctor del anterior» devuelve
 * una lista vacía sin que se vea por qué.
 */
function enviarSoltandoDoctor(e: React.ChangeEvent<HTMLSelectElement>): void {
  const form = e.currentTarget.form
  if (!form) return
  const doctor = form.elements.namedItem('doctor')
  if (doctor instanceof HTMLSelectElement) doctor.value = ''
  form.requestSubmit()
}

interface Props {
  filtros: FiltrosResueltos
  conteoEstado: ConteoEstados
  conteoPago: Record<FiltroPago, number>
  /** false = técnico sin permiso de importes: el cobro no se ofrece. */
  montos: boolean
  consultorios: ConsultorioOpcion[]
  doctores: DoctorOpcion[]
}

/**
 * Filtros del reporte, con el mismo vocabulario que la lista de Trabajos.
 *
 * Estado, cobro y periodo navegan por enlaces y viven en la URL: el filtro se
 * aplica al tocarlo y desapareció el botón «Ver reporte». El consultorio y el
 * doctor siguen siendo listas —son demasiadas opciones para un segmentado— y
 * navegan al elegir.
 *
 * Las fichas de cobro se ocultan sin permiso de importes: en una pantalla donde
 * no se ve un solo monto, «por cobrar» y «pagados» no distinguen nada que el
 * usuario pueda comprobar.
 */
export function FiltrosReporte({
  filtros: f,
  conteoEstado,
  conteoPago,
  montos,
  consultorios,
  doctores,
}: Props) {
  const campoFecha = campoFechaDe(f.estado ?? null)
  const doctoresVisibles = f.consultorioId
    ? doctores.filter((d) => d.consultorio_id === f.consultorioId)
    : doctores

  return (
    <div className="flex flex-col items-start gap-2.5">
      <Segmentado
        etiquetaGrupo="Estado del trabajo"
        activa={f.estado ?? 'todos'}
        opciones={ESTADOS.map((e) => ({
          clave: e.clave,
          etiqueta: e.etiqueta,
          href: enlaceReporte(f, { estado: e.estado }),
          conteo: e.estado ? conteoEstado[e.estado] : conteoEstado.todos,
        }))}
      />

      <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
        {montos ? (
          <div className="flex gap-2" role="group" aria-label="Situación de cobro">
            {COBROS.map((c) => {
              const activa = f.pago === c
              return (
                <Link
                  key={c}
                  // Volver a tocar la ficha activa la apaga: sin filtro de cobro.
                  href={enlaceReporte(f, { pago: activa ? 'cualquiera' : c })}
                  aria-pressed={activa}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] transition-colors ${
                    activa
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent-ink)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                  }`}
                >
                  {ETIQUETA_FILTRO_PAGO[c]}
                  <span className="num text-[11.5px] opacity-65">{conteoPago[c]}</span>
                </Link>
              )
            })}
          </div>
        ) : null}

        <nav
          aria-label={`Periodo por fecha de ${ETIQUETA_CAMPO_FECHA[campoFecha].toLowerCase()}`}
          className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          <span
            aria-hidden
            className="shrink-0 pr-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)] opacity-70"
          >
            {ETIQUETA_CAMPO_FECHA[campoFecha]}
          </span>
          {PERIODOS_REPORTE.map((p: PeriodoReporte) => {
            const activo = f.periodo === p
            return (
              <Link
                key={p}
                href={enlaceReporte(f, { periodo: p })}
                aria-current={activo ? 'page' : undefined}
                className={`shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-[13px] transition-colors ${
                  activo
                    ? 'font-semibold text-[var(--color-accent)] underline decoration-2 underline-offset-[5px]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {ETIQUETA_PERIODO_REPORTE[p]}
              </Link>
            )
          })}
        </nav>
      </div>

      {f.periodo === 'rango' ? (
        <form
          method="get"
          action="/reportes"
          className="grid w-full grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:w-auto"
        >
          {/* GET: los demás filtros viajan ocultos o se perderían al aplicar. */}
          <input type="hidden" name="periodo" value="rango" />
          {f.estado ? <input type="hidden" name="estado" value={f.estado} /> : null}
          {f.pago !== 'por_cobrar' ? (
            <input type="hidden" name="pago" value={f.pago} />
          ) : null}
          {f.consultorioId ? (
            <input type="hidden" name="consultorio" value={f.consultorioId} />
          ) : null}
          {f.doctorId ? <input type="hidden" name="doctor" value={f.doctorId} /> : null}

          <label className="space-y-1">
            <span className={etiquetaCampo}>Desde</span>
            <input type="date" name="desde" defaultValue={f.desde} className={campo} />
          </label>
          <label className="space-y-1">
            <span className={etiquetaCampo}>Hasta</span>
            <input type="date" name="hasta" defaultValue={f.hasta} className={campo} />
          </label>
          <button
            type="submit"
            className="col-span-2 h-11 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-contrast)]"
          >
            Aplicar
          </button>
        </form>
      ) : null}

      {/*
        Las listas van en su propio formulario GET y se envían al cambiar.
        No se usa el router de Next a propósito: así el componente no depende
        del framework para funcionar ni para probarse, y sin JavaScript el
        formulario sigue siendo un GET válido.
      */}
      <form method="get" action="/reportes" className="w-full sm:w-auto">
        {f.periodo !== 'mes' ? <input type="hidden" name="periodo" value={f.periodo} /> : null}
        {f.periodo === 'rango' ? (
          <>
            <input type="hidden" name="desde" value={f.desde} />
            <input type="hidden" name="hasta" value={f.hasta} />
          </>
        ) : null}
        {f.estado ? <input type="hidden" name="estado" value={f.estado} /> : null}
        {f.pago !== 'por_cobrar' ? <input type="hidden" name="pago" value={f.pago} /> : null}

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={etiquetaCampo}>Consultorio</span>
            <select
              name="consultorio"
              defaultValue={f.consultorioId ?? ''}
              onChange={enviarSoltandoDoctor}
              className={`${campo} sm:w-[220px]`}
            >
              <option value="">Todos los consultorios</option>
              {consultorios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className={etiquetaCampo}>Doctor</span>
            <select
              name="doctor"
              // `key` fuerza a rehacer la lista al cambiar de consultorio, para
              // que no quede seleccionado un doctor que ya no aparece.
              key={f.consultorioId ?? 'todos'}
              defaultValue={f.doctorId ?? ''}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className={`${campo} sm:w-[220px]`}
            >
              <option value="">Todos los doctores</option>
              {doctoresVisibles.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Red de seguridad sin JavaScript: con él, el envío ya ocurrió. */}
        <noscript>
          <button
            type="submit"
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-contrast)]"
          >
            Aplicar
          </button>
        </noscript>
      </form>
    </div>
  )
}
