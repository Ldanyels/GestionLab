import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { EstadoBadge } from './EstadoBadge'
import { PagoChip } from './PagoChip'
import { estadoDeEntrega } from '@/lib/trabajos/plazo'
import { diaMes } from '@/lib/fechas'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import type { TrabajoListItem } from '@/lib/trabajos/types'

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
 * Las dos fechas del trabajo: cuándo entró y para cuándo está.
 *
 * El ingreso **siempre**. Antes solo se mostraba la fecha de entrega, y como la
 * mayoría de los trabajos no la lleva, el 71% de la lista salía sin ninguna
 * fecha —los 58 en curso, todos—. Solo los entregados mostraban algo, porque
 * son los únicos con una fecha puesta. La consecuencia práctica era que nadie
 * podía ver cuánto llevaba una pieza en el taller sin abrirla.
 *
 * La de entrega solo si existe, y si el trabajo ya salió manda la **real**: la
 * promesa deja de informar cuando la pieza se entregó, y tener las dos a la vez
 * invita a leer una por la otra.
 */
function FechasDelTrabajo({ trabajo: t, hoy }: { trabajo: TrabajoListItem; hoy?: string }) {
  const entregado = t.estado === 'entregado'
  const prometida = entregado ? null : t.fecha_entrega

  /*
    El atraso se marca en la propia tarjeta, no solo en la pantalla Hoy.

    Quien recorre la lista está decidiendo qué hacer a continuación, y una
    fecha pasada en gris no se distingue de una futura. Sin `hoy` no se marca:
    el reloj del dispositivo daría por vencido, en otra zona horaria, algo que
    vence hoy.
  */
  const atrasada = hoy ? estadoDeEntrega(t, hoy) === 'atrasada' : false

  return (
    <p className="num text-xs text-[var(--color-muted)]">
      Ingresó {diaMes(t.fecha_ingreso)}
      {entregado && t.entregado_el ? <> · Entregado {diaMes(t.entregado_el)}</> : null}
      {prometida ? (
        <>
          {' · '}
          <span className={atrasada ? 'font-semibold text-[var(--color-danger)]' : undefined}>
            {atrasada ? 'Atrasada' : 'Entrega'} {diaMes(prometida)}
          </span>
        </>
      ) : null}
    </p>
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

        {/*
          Las fechas en su propia línea y no junto al chip de pago.

          Desde que el ingreso se muestra siempre, la línea es más larga que
          antes; compartiendo fila con el chip y el precio se apretaba en un
          teléfono. Aquí dispone del ancho completo, y además queda en el mismo
          sitio que en la pantalla Hoy.
        */}
        <FechasDelTrabajo trabajo={t} hoy={hoy} />

        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            {montos ? <PagoChip saldo={t.saldo} /> : null}
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
