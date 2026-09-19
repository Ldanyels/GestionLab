import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { colorConsultorio } from '@/lib/consultorios/color'
import { diaMes } from '@/lib/fechas'
import { formatMoney } from '@/lib/format'
import { ETIQUETA_MOVIMIENTO, type Movimiento } from '@/lib/hoy/movimientos'
import type { TrabajoListItem } from '@/lib/trabajos/types'

const TONO: Record<Movimiento, 'acento' | 'exito' | 'aviso' | 'neutro'> = {
  ingreso: 'neutro',
  cierre: 'acento',
  entrega: 'exito',
  cobro: 'aviso',
}

/**
 * Un trabajo que se movió hoy, con lo que le pasó.
 *
 * Lleva **todas** sus etiquetas: un trabajo que entró, se cerró y se cobró el
 * mismo día aparece una vez con las tres. Antes esta pantalla solo mostraba lo
 * que había ingresado hoy, así que un trabajo de la semana pasada terminado
 * esta mañana no salía en ningún sitio.
 */
export function TarjetaMovimiento({
  trabajo: t,
  movimientos,
  cobradoHoy,
  montos,
}: {
  trabajo: TrabajoListItem
  movimientos: Movimiento[]
  /** Lo cobrado hoy sobre este trabajo. Solo se muestra si hubo cobro. */
  cobradoHoy: number
  montos: boolean
}) {
  return (
    <Link href={`/trabajos/${t.id}`} className="block">
      <Card
        tono="lista"
        colorLateral={colorConsultorio(t.consultorio_nombre)}
        className="space-y-1.5 px-3.5 py-3 transition-transform hover:-translate-y-px"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="titulo-balance min-w-0 text-[15.5px] font-semibold">{t.tipo_nombre}</p>
          {/*
            Las etiquetas del movimiento en lugar del estado.

            El estado dice en qué punto está el trabajo; aquí lo que interesa es
            qué le pasó **hoy**, que es otra cosa: un trabajo «en curso» puede
            haberse cobrado esta mañana.
          */}
          <span className="flex shrink-0 flex-wrap justify-end gap-1">
            {movimientos.map((m) => (
              <Chip key={m} tono={TONO[m]}>
                {ETIQUETA_MOVIMIENTO[m]}
              </Chip>
            ))}
          </span>
        </div>

        <p className="truncate text-[13px] text-[var(--color-muted)]">
          {t.consultorio_nombre} · {t.doctor_nombre}
          {t.paciente_nombre ? ` · ${t.paciente_nombre}` : ''}
        </p>

        <div className="flex items-baseline justify-between gap-3">
          <span className="num text-[12px] text-[var(--color-muted)]">
            Ingresó {diaMes(t.fecha_ingreso)}
            {t.entregado_el ? ` · Entregado ${diaMes(t.entregado_el)}` : ''}
          </span>
          {/*
            El importe que se muestra es **lo cobrado hoy**, no el precio del
            trabajo: en una lista de movimientos del día, el precio de algo que
            solo se entregó no es un movimiento de dinero.
          */}
          {montos && cobradoHoy > 0 ? (
            <span className="num shrink-0 text-[14px] font-bold text-[var(--color-success)]">
              +{formatMoney(cobradoHoy)}
            </span>
          ) : null}
        </div>
      </Card>
    </Link>
  )
}
