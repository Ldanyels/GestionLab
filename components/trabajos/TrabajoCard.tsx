import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { EstadoBadge } from './EstadoBadge'
import { PagoChip } from './PagoChip'
import { estadoDeEntrega } from '@/lib/trabajos/plazo'
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
  /**
   * Hoy en Lima, para marcar el atraso. Opcional: sin él la tarjeta no marca
   * nada, que es preferible a calcularlo con el reloj del dispositivo.
   */
  hoy?: string
}

/**
 * La fecha de la tarjeta: la real si el trabajo ya salió, la prometida si no.
 *
 * Un trabajo entregado no muestra la prometida ni como respaldo. Lo que
 * interesa de un entregado es cuándo salió, y ofrecer la promesa en su lugar
 * invitaría a leerla como si fuera la entrega.
 */
function FechaDeEntrega({ trabajo: t, hoy }: { trabajo: TrabajoListItem; hoy?: string }) {
  const entregado = t.estado === 'entregado'
  const fecha = entregado ? t.entregado_el : t.fecha_entrega
  if (!fecha) return null

  /*
    El atraso se marca en la propia tarjeta, no solo en la pantalla Hoy.

    Quien recorre la lista de trabajos está decidiendo qué hacer a
    continuación, y una fecha pasada en gris no se distingue de una futura. Sin
    `hoy` la tarjeta no puede saberlo y se comporta como antes: la fecha del
    dispositivo no sirve, porque en otra zona horaria marcaría atrasado un
    trabajo que vence hoy.
  */
  const atrasada = hoy ? estadoDeEntrega(t, hoy) === 'atrasada' : false

  return (
    <span
      className={`shrink-0 text-xs ${
        atrasada ? 'font-semibold text-[var(--color-danger)]' : 'text-[var(--color-muted)]'
      }`}
    >
      {entregado ? 'Entregado' : atrasada ? 'Atrasada' : 'Entrega'} {diaMes(fecha)}
    </span>
  )
}

/** Tarjeta de la lista de trabajos: resumen, cliente y estado de pago. */
export function TrabajoCard({ trabajo: t, montos, hoy }: Props) {
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
            <FechaDeEntrega trabajo={t} hoy={hoy} />
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
