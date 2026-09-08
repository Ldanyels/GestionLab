import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import { ETIQUETA_TRABAJO } from '@/lib/trabajos/estado'
import type { TrabajoListItem } from '@/lib/trabajos/types'

interface Props {
  trabajo: TrabajoListItem
  /** Si es falso, no se pinta el precio: el técnico no ve importes internos. */
  montos: boolean
  /** Añade el chip de estado. Se usa en la lista de realizados del día. */
  conEstado?: boolean
}

const TONO_ESTADO = {
  en_curso: 'aviso',
  cerrado: 'acento',
  entregado: 'exito',
} as const

/** Fila de la pantalla Hoy: una entrega del día, pendiente o ya hecha. */
export function TarjetaEntrega({ trabajo: t, montos, conEstado }: Props) {
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
