import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { formatMoney } from '@/lib/format'
import {
  diasSinActividad,
  estadoDeActividad,
  ETIQUETA_ACTIVIDAD,
  tendencia,
  type EstadoActividad,
  type MetricaDeLaboratorio,
} from '@/lib/plataforma/metricas'

/** Cuánto pesa una foto ya comprimida, para estimar el consumo. */
const MB_POR_FOTO = 0.3

const TONO: Record<EstadoActividad, 'exito' | 'peligro' | 'neutro'> = {
  activo: 'exito',
  bajando: 'peligro',
  dormido: 'peligro',
  sin_arrancar: 'neutro',
}

/**
 * Un laboratorio con sus métricas.
 *
 * Lo primero que se lee es si está vivo, no cuánto consume. Un cliente que deja
 * de registrar trabajos deja de pagar semanas después, y esa es la cifra que
 * todavía permite hacer algo —llamarlo— mientras la cuota impagada ya es un
 * cliente perdido.
 */
export function FilaDeMetrica({
  m,
  hoy,
}: {
  m: MetricaDeLaboratorio
  hoy: string
}) {
  const estado = estadoDeActividad(m, hoy)
  const t = tendencia(m.trabajos_7, m.trabajos_previos_7)
  const dias = diasSinActividad(m.ultimo_trabajo, hoy)
  const consumoMb = m.fotos * MB_POR_FOTO

  return (
    <Card tono="lista" className="space-y-2.5 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="min-w-0">
          <Link
            href={`/plataforma/${m.laboratorio_id}`}
            prefetch={false}
            className="truncate text-[15.5px] font-semibold text-[var(--color-accent)]"
          >
            {m.nombre}
          </Link>
          <span className="mt-0.5 block text-[12.5px] text-[var(--color-muted)]">
            {m.plan === 'pagado'
              ? `${formatMoney(m.precio_cuota ?? 0)} ${m.periodicidad === 'anual' ? 'al año' : 'al mes'}`
              : 'Cortesía'}
            {m.estado !== 'activo' ? ' · suspendido' : ''}
          </span>
        </span>
        <Chip tono={TONO[estado]}>{ETIQUETA_ACTIVIDAD[estado]}</Chip>
      </div>

      {/*
        Las dos semanas, una al lado de la otra.

        La comparación es el dato, no el número suelto: «12 trabajos» no dice
        nada; «12 esta semana contra 31 la anterior» dice que hay que llamar.
      */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Dato etiqueta="Últimos 7 días" valor={String(m.trabajos_7)} />
        <Dato etiqueta="7 anteriores" valor={String(m.trabajos_previos_7)} />
        <Dato
          etiqueta="Variación"
          valor={
            t.direccion === 'nuevo'
              ? 'nuevo'
              : t.pct === 0
                ? '='
                : `${t.pct > 0 ? '+' : ''}${t.pct}%`
          }
          tono={t.direccion === 'baja' && t.pct <= -40 ? 'peligro' : undefined}
        />
      </div>

      <p className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
        {m.trabajos_mes} este mes · {m.trabajos_total} en total
        {dias === null
          ? ' · sin ningún trabajo todavía'
          : dias === 0
            ? ' · con actividad hoy'
            : ` · ${dias} ${dias === 1 ? 'día' : 'días'} sin actividad`}
      </p>

      {/*
        Consumo y soporte en letra pequeña, y a propósito.

        Medido: caben 51 laboratorios como este en el plan contratado, así que
        el consumo solo sirve para detectar a uno que se dispare, no para
        decidir el precio. Los accesos de soporte y los errores dicen mejor
        cuánto cuesta un cliente, porque lo que se paga ahí son horas.
      */}
      <p className="border-t border-[var(--color-border)] pt-2 text-[12px] text-[var(--color-muted)]">
        {m.fotos} {m.fotos === 1 ? 'foto' : 'fotos'}
        {consumoMb > 0 ? ` (~${consumoMb < 1024 ? `${Math.round(consumoMb)} MB` : `${(consumoMb / 1024).toFixed(1)} GB`})` : ''}
        {' · '}
        {m.accesos_soporte} {m.accesos_soporte === 1 ? 'acceso de soporte' : 'accesos de soporte'}
        {m.errores > 0 ? (
          <>
            {' · '}
            <span className="font-semibold text-[var(--color-danger)]">
              {m.errores} {m.errores === 1 ? 'error abierto' : 'errores abiertos'}
            </span>
          </>
        ) : null}
      </p>
    </Card>
  )
}

function Dato({
  etiqueta,
  valor,
  tono,
}: {
  etiqueta: string
  valor: string
  tono?: 'peligro'
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 py-2">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--color-muted)]">
        {etiqueta}
      </p>
      <p
        className={`num mt-0.5 text-[15px] font-bold ${
          tono === 'peligro' ? 'text-[var(--color-danger)]' : ''
        }`}
      >
        {valor}
      </p>
    </div>
  )
}
