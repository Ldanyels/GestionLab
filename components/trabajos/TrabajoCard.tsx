import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { EstadoBadge } from './EstadoBadge'
import { PagoChip } from './PagoChip'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import type { TrabajoListItem } from '@/lib/trabajos/types'

/** dd/mm a partir de una fecha ISO. */
function diaMes(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}`
}

interface Props {
  trabajo: TrabajoListItem
  /** false = sin importes ni deuda (técnico sin permiso). */
  montos: boolean
}

/** Tarjeta de la lista de trabajos: resumen, cliente y estado de pago. */
export function TrabajoCard({ trabajo: t, montos }: Props) {
  return (
    <Link href={`/trabajos/${t.id}`} className="block">
      <Card
        tono="lista"
        colorLateral={colorConsultorio(t.consultorio_nombre)}
        className="space-y-1.5 p-3.5 transition-transform hover:-translate-y-px"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="titulo-balance min-w-0 text-base font-semibold">{t.tipo_nombre}</p>
          <EstadoBadge estado={t.estado} />
        </div>

        <p className="truncate text-[13px] text-[var(--color-muted)]">
          {t.consultorio_nombre} · {t.doctor_nombre}
          {t.paciente_nombre ? ` · ${t.paciente_nombre}` : ''}
        </p>

        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            {montos ? <PagoChip saldo={t.saldo} /> : null}
            {t.fecha_entrega ? (
              <span className="shrink-0 text-xs text-[var(--color-muted)]">
                Entrega {diaMes(t.fecha_entrega)}
              </span>
            ) : null}
          </span>
          {montos ? (
            <span className="num shrink-0 text-base font-bold">
              {formatMoney(t.precio_acordado)}
            </span>
          ) : null}
        </div>
      </Card>
    </Link>
  )
}
