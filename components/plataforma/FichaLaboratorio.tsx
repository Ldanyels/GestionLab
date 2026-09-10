import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { formatMoney } from '@/lib/format'
import {
  porCobrarDe,
  ultimoIngresoDe,
  type ResumenDeLaboratorio,
  type TrabajoDePlataforma,
} from '@/lib/plataforma/laboratorio-detalle'

function Cifra({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {etiqueta}
      </p>
      <p className="num mt-0.5 text-[17px] font-bold">{valor}</p>
    </div>
  )
}

/**
 * Ficha de un laboratorio vista desde la plataforma.
 *
 * No muestra nombres de pacientes, y no porque los oculte: los datos no vienen
 * con ese campo. Un trabajo se reconoce por su tipo, su doctor y su fecha.
 */
export function FichaLaboratorio({
  resumen,
  trabajos,
}: {
  resumen: ResumenDeLaboratorio
  trabajos: readonly TrabajoDePlataforma[]
}) {
  const { laboratorio: lab } = resumen
  const ultimo = ultimoIngresoDe(trabajos)

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">{lab.nombre}</h1>
          <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
            Último ingreso: {ultimo ?? 'sin actividad'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {lab.estado === 'suspendido' ? <Chip tono="peligro">Suspendido</Chip> : null}
          <Chip tono={lab.plan === 'pagado' ? 'exito' : 'neutro'}>
            {lab.plan === 'pagado' ? 'Pagado' : 'Cortesía'}
          </Chip>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cifra etiqueta="Usuarios" valor={lab.usuarios} />
        <Cifra etiqueta="Consultorios" valor={resumen.consultorios} />
        <Cifra etiqueta="Doctores" valor={resumen.doctores} />
        <Cifra etiqueta="Por cobrar" valor={formatMoney(porCobrarDe(trabajos))} />
      </div>

      {trabajos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[15px] font-semibold">Este laboratorio no ha registrado trabajos</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {trabajos.map((t) => (
            <li key={t.id}>
              {/*
                `prefetch={false}`: una lista de decenas de trabajos, con la
                precarga al pasar el ratón, dispararía una consulta a la base
                por cada uno que se roce.
              */}
              <Link
                href={`/plataforma/${lab.id}/trabajos/${t.id}`}
                prefetch={false}
                className="block"
              >
                <Card
                  tono="lista"
                  className="space-y-1 p-3.5 transition-transform hover:-translate-y-px"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-[15.5px] font-semibold">{t.tipo_nombre}</p>
                    <span className="num shrink-0 text-[15px] font-bold">
                      {formatMoney(t.precio_acordado)}
                    </span>
                  </div>
                  <p className="truncate text-[13px] text-[var(--color-muted)]">
                    {t.consultorio_nombre} · {t.doctor_nombre} ·{' '}
                    {t.entregado_el
                      ? `entregado ${t.entregado_el}`
                      : `ingresó ${t.fecha_ingreso}`}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
