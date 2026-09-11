import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { requireSuperAdmin } from '@/lib/plataforma/acceso'
import { metricasDeLaboratorios } from '@/lib/plataforma/metricas-data'
import { estadoDeActividad, resumenDelNegocio } from '@/lib/plataforma/metricas'
import { hoyLima } from '@/lib/trabajos/agenda'
import { formatMoney } from '@/lib/format'
import { FilaDeMetrica } from '@/components/plataforma/FilaDeMetrica'

/**
 * Cómo va el negocio y cómo va cada laboratorio.
 *
 * La pregunta que lo originó era si sigue siendo rentable cobrar S/250 al mes.
 * La respuesta medida es que sí con holgura —caben 51 laboratorios como
 * MasterLab en el plan contratado— y que por tanto **el consumo no es lo que
 * hay que vigilar**.
 *
 * Lo que decide el ingreso es si el cliente sigue usando el sistema. Un
 * laboratorio que se va deja de registrar trabajos semanas antes de dejar de
 * pagar, y cuando aparece la cuota impagada ya se perdió. Por eso lo primero
 * que se ve aquí es a cuántos hay que llamar.
 */
export default async function MetricasPage() {
  await requireSuperAdmin()
  const hoy = hoyLima()
  const labs = await metricasDeLaboratorios()
  const r = resumenDelNegocio(labs, hoy)

  // Primero los que necesitan atención: es una pantalla para actuar, no para
  // admirar. Dentro de cada grupo, el que más trabaja arriba.
  const ordenados = [...labs].sort((a, b) => {
    const aAtiende = estadoDeActividad(a, hoy) !== 'activo' ? 0 : 1
    const bAtiende = estadoDeActividad(b, hoy) !== 'activo' ? 0 : 1
    return aAtiende !== bAtiende ? aAtiende - bAtiende : b.trabajos_7 - a.trabajos_7
  })

  return (
    <section className="space-y-4">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent)]">
          Plataforma
        </p>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">Métricas</h1>
        <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
          Del mes en curso y de las dos últimas semanas.
        </p>
      </header>

      {/* Bloque 4: las cifras del negocio entero. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cifra etiqueta="Ingreso al mes" valor={formatMoney(r.ingresoMensual)} />
        <Cifra etiqueta="Laboratorios" valor={`${r.dePago} de pago`} />
        <Cifra etiqueta="Trabajos del mes" valor={String(r.trabajosDelMes)} />
        <Cifra
          etiqueta="Hay que llamar"
          valor={String(r.necesitanAtencion)}
          tono={r.necesitanAtencion > 0 ? 'peligro' : undefined}
        />
      </div>

      <Card className="p-3.5">
        <p className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
          {r.total} {r.total === 1 ? 'laboratorio' : 'laboratorios'}: {r.dePago} de pago,{' '}
          {r.deCortesia} de cortesía
          {r.suspendidos > 0 ? `, ${r.suspendidos} suspendido${r.suspendidos === 1 ? '' : 's'}` : ''}.
          {/*
            El ingreso comprometido es lo que deberían pagar, no lo cobrado. Lo
            cobrado está en la pantalla de laboratorios, donde además aparece la
            mora: son dos preguntas distintas y mezclarlas daría una cifra que
            no responde ninguna.
          */}{' '}
          El ingreso es el comprometido de los activos de pago, con los anuales
          prorrateados. Lo efectivamente cobrado está en{' '}
          <Link href="/plataforma" className="font-semibold text-[var(--color-accent)]">
            Laboratorios
          </Link>
          .
        </p>
      </Card>

      {/* Bloques 1, 2 y 3: actividad, soporte y consumo de cada uno. */}
      {ordenados.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[15px] font-semibold">Todavía no hay laboratorios</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {ordenados.map((m) => (
            <li key={m.laboratorio_id}>
              <FilaDeMetrica m={m} hoy={hoy} />
            </li>
          ))}
        </ul>
      )}

      <Link href="/plataforma" className="inline-block text-[13.5px] text-[var(--color-accent)]">
        ‹ Volver a laboratorios
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
