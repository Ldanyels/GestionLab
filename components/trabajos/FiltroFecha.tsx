import { PastillaFiltro } from '@/components/ui/PastillaFiltro'
import {
  enlaceTrabajos,
  ETIQUETA_PERIODO,
  PERIODOS_CON_CONTEO,
  type Periodo,
  type PeriodoConConteo,
} from '@/lib/trabajos/periodo'
import type { EstadoTrabajo } from '@/lib/trabajos/estado'

interface Props {
  periodo: Periodo
  desde?: string
  hasta?: string
  conteo: Record<PeriodoConConteo, number>
  /** Filtros vigentes que hay que conservar al cambiar de periodo. */
  estado?: EstadoTrabajo
  q?: string
}

const campo =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'

/**
 * Filtro por fecha de ingreso: pastillas para los periodos comunes y, al elegir
 * «Rango…», dos campos de fecha para un intervalo exacto.
 *
 * Es un componente de servidor a propósito. Que el rango esté desplegado o no
 * depende de `?periodo=rango` en la URL, no de estado en el cliente: así no
 * hace falta JavaScript, funciona igual con la conexión caída a medias, y el
 * enlace se puede compartir ya desplegado y con las fechas puestas.
 */
export function FiltroFecha({ periodo, desde, hasta, conteo, estado, q }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {PERIODOS_CON_CONTEO.map((p) => (
          <PastillaFiltro
            key={p}
            href={enlaceTrabajos({ estado, q, periodo: p })}
            activa={periodo === p}
            conteo={conteo[p]}
          >
            {ETIQUETA_PERIODO[p]}
          </PastillaFiltro>
        ))}
        <PastillaFiltro
          href={enlaceTrabajos({ estado, q, periodo: 'rango', desde, hasta })}
          activa={periodo === 'rango'}
        >
          {ETIQUETA_PERIODO.rango}
        </PastillaFiltro>
      </div>

      {periodo === 'rango' ? (
        <form className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          {/* El periodo y los otros filtros viajan como campos ocultos para no
              perderse al enviar el formulario. */}
          <input type="hidden" name="periodo" value="rango" />
          {estado ? <input type="hidden" name="estado" value={estado} /> : null}
          {q ? <input type="hidden" name="q" value={q} /> : null}

          <label className="space-y-1">
            <span className="text-xs text-[var(--color-muted)]">Desde</span>
            <input type="date" name="desde" defaultValue={desde} className={campo} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-[var(--color-muted)]">Hasta</span>
            <input type="date" name="hasta" defaultValue={hasta} className={campo} />
          </label>

          <button
            type="submit"
            className="col-span-2 h-11 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-contrast)]"
          >
            Aplicar
          </button>
        </form>
      ) : null}
    </div>
  )
}
