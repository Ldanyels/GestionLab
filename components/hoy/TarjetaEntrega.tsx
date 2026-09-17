import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { colorConsultorio } from '@/lib/consultorios/color'
import { diaMes } from '@/lib/fechas'
import { estadoDeEntrega } from '@/lib/trabajos/plazo'
import { formatMoney } from '@/lib/format'
import { ETIQUETA_TRABAJO } from '@/lib/trabajos/estado'
import type { TrabajoListItem } from '@/lib/trabajos/types'

interface Props {
  trabajo: TrabajoListItem
  /** Si es falso, no se pinta el precio: el técnico no ve importes internos. */
  montos: boolean
  /** Añade el chip de estado. Se usa en la lista de realizados del día. */
  conEstado?: boolean
  /**
   * Hoy en Lima, para marcar el atraso. Opcional: sin él la fecha se muestra
   * igual pero sin señalar si venció, porque calcularlo con el reloj del
   * dispositivo marcaría atrasado, en otra zona horaria, algo que vence hoy.
   */
  hoy?: string
}

const TONO_ESTADO = {
  en_curso: 'aviso',
  cerrado: 'acento',
  entregado: 'exito',
} as const

/** Fila de la pantalla Hoy: una entrega del día, pendiente o ya hecha. */
export function TarjetaEntrega({ trabajo: t, montos, conEstado, hoy }: Props) {
  const atrasada = hoy ? estadoDeEntrega(t, hoy) === 'atrasada' : false

  return (
    <Link href={`/trabajos/${t.id}`} className="block">
      <Card
        tono="lista"
        colorLateral={colorConsultorio(t.consultorio_nombre)}
        className="px-3.5 py-3 transition-transform hover:-translate-y-px"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="titulo-balance text-[15.5px] font-semibold">{t.tipo_nombre}</p>
            <p className="mt-0.5 truncate text-[13px] text-[var(--color-muted)]">
              {t.consultorio_nombre} · {t.doctor_nombre}
              {t.paciente_nombre ? ` · ${t.paciente_nombre}` : ''}
            </p>
            {/*
              Las dos fechas del trabajo: cuándo entró y para cuándo está.

              El ingreso siempre, porque dice cuánto lleva en el taller. La
              entrega solo si se prometió alguna —la mitad de los trabajos no
              la llevan— y en rojo si ya venció, que es la única de las dos que
              pide hacer algo.
            */}
            <p className="num mt-0.5 text-[12px] text-[var(--color-muted)]">
              Ingresó {diaMes(t.fecha_ingreso)}
              {t.estado === 'entregado' && t.entregado_el ? (
                <> · Entregado {diaMes(t.entregado_el)}</>
              ) : t.fecha_entrega ? (
                <>
                  {' · '}
                  <span
                    className={
                      atrasada ? 'font-semibold text-[var(--color-danger)]' : undefined
                    }
                  >
                    {atrasada ? 'Atrasada' : 'Entrega'} {diaMes(t.fecha_entrega)}
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {conEstado ? (
              <Chip tono={TONO_ESTADO[t.estado]} conPunto>
                {ETIQUETA_TRABAJO[t.estado]}
              </Chip>
            ) : null}
            {montos ? (
              <span className="num text-sm font-semibold">
                {formatMoney(t.precio_acordado)}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  )
}
