import { PastillaFiltro } from '@/components/ui/PastillaFiltro'
import { FiltroFecha } from './FiltroFecha'
import { enlaceTrabajos, type FiltrosResueltos } from '@/lib/trabajos/consulta'
import { ETIQUETA_FILTRO_PAGO, FILTROS_PAGO, type FiltroPago } from '@/lib/trabajos/pago'
import type { PeriodoConConteo } from '@/lib/trabajos/periodo'
import type { ConteoEstados } from '@/lib/trabajos/filtro'
import type { EstadoTrabajo } from '@/lib/trabajos/estado'

const ESTADOS: { etiqueta: string; estado?: EstadoTrabajo }[] = [
  { etiqueta: 'Todos' },
  { etiqueta: 'En curso', estado: 'en_curso' },
  { etiqueta: 'Cerrados', estado: 'cerrado' },
  { etiqueta: 'Entregados', estado: 'entregado' },
]

interface Props {
  filtros: FiltrosResueltos
  conteoEstado: ConteoEstados
  conteoPago: Record<FiltroPago, number>
  conteoPeriodo: Record<PeriodoConConteo, number>
}

const rotulo =
  'text-[10.5px] font-bold uppercase tracking-[0.09em] text-[var(--color-muted)]'
const fila = '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1'

/**
 * Las tres filas de filtros de la lista: estado, cobro y fecha.
 *
 * Son independientes y se combinan, así que «Entregados» + «Por cobrar» da la
 * cartera entregada sin cobrar sin necesidad de una pastilla dedicada. El
 * título de la pantalla nombra la combinación (`tituloTrabajos`) para que se
 * lea como una sola idea.
 *
 * El conteo de cada fila se calcula sobre lo que las otras dos ya dejaron
 * pasar, de modo que ningún número prometa resultados que el filtro combinado
 * no va a devolver.
 */
export function FiltrosLista({ filtros, conteoEstado, conteoPago, conteoPeriodo }: Props) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className={rotulo}>Estado</p>
        <div className={fila}>
          {ESTADOS.map((e) => (
            <PastillaFiltro
              key={e.etiqueta}
              href={enlaceTrabajos({ ...filtros, estado: e.estado })}
              activa={e.estado === filtros.estado}
              conteo={e.estado ? conteoEstado[e.estado] : conteoEstado.todos}
            >
              {e.etiqueta}
            </PastillaFiltro>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className={rotulo}>Cobro</p>
        <div className={fila}>
          {FILTROS_PAGO.map((p) => (
            <PastillaFiltro
              key={p}
              href={enlaceTrabajos({ ...filtros, pago: p })}
              activa={p === filtros.pago}
              conteo={conteoPago[p]}
            >
              {ETIQUETA_FILTRO_PAGO[p]}
            </PastillaFiltro>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className={rotulo}>Fecha de ingreso</p>
        <FiltroFecha filtros={filtros} conteo={conteoPeriodo} />
      </div>
    </div>
  )
}
