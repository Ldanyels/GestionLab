import Link from 'next/link'
import { Segmentado } from '@/components/ui/Segmentado'
import { enlaceTrabajos, type FiltrosResueltos } from '@/lib/trabajos/consulta'
import { ETIQUETA_FILTRO_PAGO, type FiltroPago } from '@/lib/trabajos/pago'
import { ETIQUETA_PERIODO, PERIODOS, type Periodo } from '@/lib/trabajos/periodo'
import type { ConteoEstados } from '@/lib/trabajos/filtro'
import type { EstadoTrabajo } from '@/lib/trabajos/estado'

const ESTADOS: { clave: string; etiqueta: string; estado?: EstadoTrabajo }[] = [
  { clave: 'todos', etiqueta: 'Todos' },
  { clave: 'en_curso', etiqueta: 'En curso', estado: 'en_curso' },
  { clave: 'cerrado', etiqueta: 'Cerrados', estado: 'cerrado' },
  { clave: 'entregado', etiqueta: 'Entregados', estado: 'entregado' },
]

/** Los dos estados de cobro. Ninguno activo significa "cualquiera". */
const COBROS: FiltroPago[] = ['por_cobrar', 'pagados']

interface Props {
  filtros: FiltrosResueltos
  conteoEstado: ConteoEstados
  conteoPago: Record<FiltroPago, number>
}

const campo =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'

/**
 * Barra de filtros de la lista de Trabajos.
 *
 * Diseñada por jerarquía, no por simetría: el estado se usa en cada visita y
 * ocupa un control segmentado propio; el cobro son dos fichas donde apagado ya
 * significa "cualquiera"; la fecha es una tira de texto, que es lo que se
 * consulta de vez en cuando.
 *
 * Ninguna fila lleva rótulo. Los controles se nombran solos —«Por cobrar» y
 * «Pagados» no pueden ser otra cosa que dinero, y «Hoy» o «7 días» no pueden
 * ser otra cosa que tiempo— así que tres rótulos en mayúsculas solo añadían
 * ruido y hacían que cada fila pareciera un aparato distinto.
 *
 * Los conteos se quedan donde deciden algo: en el estado y en el cobro. En la
 * fecha se quitaron a propósito; la línea de resumen bajo el título ya dice
 * cuántos trabajos y cuánto dinero quedaron tras aplicar los tres filtros.
 */
export function BarraFiltros({ filtros, conteoEstado, conteoPago }: Props) {
  return (
    // `items-start` para que el segmentado no se estire cuando en escritorio
    // pasa a medir lo que mide su contenido.
    <div className="flex flex-col items-start gap-2.5">
      <Segmentado
        etiquetaGrupo="Estado del trabajo"
        activa={filtros.estado ?? 'todos'}
        opciones={ESTADOS.map((e) => ({
          clave: e.clave,
          etiqueta: e.etiqueta,
          href: enlaceTrabajos({ ...filtros, estado: e.estado }),
          conteo: e.estado ? conteoEstado[e.estado] : conteoEstado.todos,
        }))}
      />

      {/*
        En escritorio, cobro y fecha van juntos y a la izquierda. Repartidos a
        los extremos del ancho quedaban a más de mil píxeles uno del otro, como
        dos controles sin relación entre sí.
      */}
      <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
        <div className="flex gap-2" role="group" aria-label="Situación de cobro">
          {COBROS.map((c) => {
            const activa = filtros.pago === c
            return (
              <Link
                key={c}
                // Volver a tocar la ficha activa la apaga: sin filtro de cobro.
                href={enlaceTrabajos({ ...filtros, pago: activa ? 'cualquiera' : c })}
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

        <TiraDeFechas filtros={filtros} />
      </div>

      {filtros.periodo === 'rango' ? <RangoDeFechas filtros={filtros} /> : null}
    </div>
  )
}

/** Los periodos como tira de texto: es la dimensión secundaria, sin cajas. */
function TiraDeFechas({ filtros }: { filtros: FiltrosResueltos }) {
  return (
    <nav
      aria-label="Fecha de ingreso"
      className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      {PERIODOS.map((p: Periodo) => {
        const activo = filtros.periodo === p
        return (
          <Link
            key={p}
            href={enlaceTrabajos({ ...filtros, periodo: p })}
            aria-current={activo ? 'page' : undefined}
            className={`shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-[13px] transition-colors ${
              activo
                ? 'font-semibold text-[var(--color-accent)] underline decoration-2 underline-offset-[5px]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {ETIQUETA_PERIODO[p]}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Rango exacto. Se despliega porque `?periodo=rango` está en la URL, no por
 * estado en el cliente: funciona sin JavaScript y el enlace se puede compartir
 * ya desplegado con las fechas puestas.
 */
function RangoDeFechas({ filtros }: { filtros: FiltrosResueltos }) {
  return (
    <form className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      {/* El formulario es un GET: los otros filtros viajan ocultos o se pierden. */}
      <input type="hidden" name="periodo" value="rango" />
      {filtros.estado ? <input type="hidden" name="estado" value={filtros.estado} /> : null}
      {filtros.pago !== 'cualquiera' ? (
        <input type="hidden" name="pago" value={filtros.pago} />
      ) : null}
      {filtros.q ? <input type="hidden" name="q" value={filtros.q} /> : null}

      <label className="space-y-1">
        <span className="text-xs text-[var(--color-muted)]">Desde</span>
        <input type="date" name="desde" defaultValue={filtros.desde} className={campo} />
      </label>
      <label className="space-y-1">
        <span className="text-xs text-[var(--color-muted)]">Hasta</span>
        <input type="date" name="hasta" defaultValue={filtros.hasta} className={campo} />
      </label>

      <button
        type="submit"
        className="col-span-2 h-11 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-contrast)]"
      >
        Aplicar
      </button>
    </form>
  )
}
