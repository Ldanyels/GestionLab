import Link from 'next/link'
import { listarLaboratorios } from '@/lib/plataforma/laboratorios'
import { generarCuotasFaltantes, todasLasCuotas } from '@/lib/cuotas/data'
import { diasDeMora } from '@/lib/cuotas/periodos'
import { resumenDeCobranza } from '@/lib/cuotas/resumen'
import { hoyLima } from '@/lib/trabajos/agenda'
import { borrarFotosVencidas } from '@/lib/fotos/data'
import { erroresRegistrados } from '@/lib/errores-registrados/data'
import { resumenDeErrores } from '@/lib/errores-registrados/resumen'
import { formatMoney } from '@/lib/format'
import { FilaLaboratorio } from '@/components/plataforma/FilaLaboratorio'

export default async function PlataformaPage() {
  const laboratorios = await listarLaboratorios()
  const activos = laboratorios.filter((l) => l.estado === 'activo').length
  const hoy = hoyLima()

  /*
    Se generan las cuotas que falten al abrir el panel, en vez de con una tarea
    programada: el momento en que hace falta saber qué se debe es justo cuando
    alguien va a mirarlo, y así no depende de que un cron se dispare.

    Es idempotente —índice único por laboratorio y periodo— así que un segundo
    renderizado no duplica nada.
  */
  for (const lab of laboratorios) await generarCuotasFaltantes(lab)

  /*
    Borrado de las fotos que pasaron los 6 meses.

    Aquí y no en una tarea programada, por la misma razón que las cuotas: no
    depende de que un cron se dispare en un servicio aparte. Va por la clave de
    servicio y alcanza a **todos** los laboratorios, porque es una obligación
    que el contrato de encargo pone sobre el proveedor, no sobre el cliente.

    Es un tope de 500 por vez y no lanza: si quedan más, se borran en la
    siguiente visita.
  */
  await borrarFotosVencidas()

  const cuotas = await todasLasCuotas()
  const cobranza = resumenDeCobranza(cuotas, hoy)

  const errores = resumenDeErrores(await erroresRegistrados(), new Date().toISOString())

  /** Días de mora de la cuota más atrasada de cada laboratorio. */
  const moraPorLab = new Map<string, number>()
  for (const c of cuotas) {
    if (c.estado !== 'pendiente') continue
    const dias = diasDeMora(c.vence_el, hoy)
    if (dias > 0) {
      moraPorLab.set(c.laboratorio_id, Math.max(moraPorLab.get(c.laboratorio_id) ?? 0, dias))
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent)]">
            Plataforma
          </p>
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">
            Laboratorios
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
            {laboratorios.length} en total · {activos} con acceso
          </p>
        </div>
        <Link
          href="/plataforma/nuevo"
          className="inline-flex h-11 shrink-0 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </header>

      {/*
        Las tres cifras de la cobranza. «Vencido» es el subconjunto de lo
        pendiente que ya pasó su fecha: es a quién hay que llamar hoy, y por eso
        va en rojo cuando existe.
      */}
      <div className="grid grid-cols-3 gap-2">
        <Cifra etiqueta="Cobrado este mes" valor={formatMoney(cobranza.cobradoEnElMes)} />
        <Cifra etiqueta="Pendiente" valor={formatMoney(cobranza.pendiente)} />
        <Cifra
          etiqueta="Vencido"
          valor={formatMoney(cobranza.vencido)}
          tono={cobranza.vencido > 0 ? 'peligro' : undefined}
        />
      </div>

      {/*
        El estado del sistema, en la primera pantalla del panel.

        Va aquí y no en un menú porque un aviso que hay que ir a buscar no es un
        aviso. Cuando no hay nada roto ocupa una línea gris; cuando lo hay, se
        ve desde la puerta.
      */}
      <Link
        href="/plataforma/errores"
        className={`flex items-center justify-between gap-3 rounded-[var(--radius-md)] border p-2.5 ${
          errores.sinResolver > 0
            ? 'border-[var(--color-danger)] bg-[var(--color-surface-2)]'
            : 'border-[var(--color-border)]'
        }`}
      >
        <span className="min-w-0">
          <span className="block text-[13.5px] font-semibold">
            {errores.sinResolver === 0
              ? 'Sin errores pendientes'
              : `${errores.sinResolver} ${
                  errores.sinResolver === 1 ? 'error sin resolver' : 'errores sin resolver'
                }`}
          </span>
          {errores.sinResolver > 0 ? (
            <span className="block text-[12.5px] text-[var(--color-muted)]">
              {errores.delDia > 0
                ? `${errores.delDia} en las últimas 24 h`
                : 'ninguno en las últimas 24 h'}
              {errores.laboratoriosAfectados > 0
                ? ` · ${errores.laboratoriosAfectados} ${
                    errores.laboratoriosAfectados === 1 ? 'laboratorio' : 'laboratorios'
                  }`
                : ''}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-[var(--color-accent)]">Ver ›</span>
      </Link>

      {laboratorios.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[15px] font-semibold">Todavía no hay laboratorios</p>
          <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
            Toca «+ Nuevo» para dar de alta el primero.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {laboratorios.map((l) => (
            <li key={l.id}>
              <FilaLaboratorio lab={l} diasDeMora={moraPorLab.get(l.id) ?? 0} />
            </li>
          ))}
        </ul>
      )}

      <Link href="/hoy" className="inline-block text-[13.5px] text-[var(--color-accent)]">
        ‹ Volver a mi laboratorio
      </Link>
    </section>
  )
}

function Cifra({
  etiqueta,
  valor,
  tono,
}: {
  etiqueta: string
  valor: string
  tono?: 'peligro'
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {etiqueta}
      </p>
      <p
        className={`num mt-0.5 text-[16px] font-bold ${
          tono === 'peligro' ? 'text-[var(--color-danger)]' : ''
        }`}
      >
        {valor}
      </p>
    </div>
  )
}
