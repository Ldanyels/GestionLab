import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { erroresRegistrados } from '@/lib/errores-registrados/data'
import { hace, resumenDeErrores, urgencia } from '@/lib/errores-registrados/resumen'
import { listarLaboratorios } from '@/lib/plataforma/laboratorios'
import { resolverErrorAction } from '../actions'

/**
 * Los errores que está dando el sistema, agrupados por tipo.
 *
 * Existe porque hasta ahora los fallos iban a la consola de Vercel, que nadie
 * mira: el laboratorio lo intentaba dos veces, se frustraba y avisaba al día
 * siguiente por WhatsApp. Esta pantalla contesta tres preguntas en el orden en
 * que se hacen: ¿está pasando ahora?, ¿a cuántos?, ¿dónde lo arreglo?
 */
export default async function ErroresPage() {
  const [errores, laboratorios] = await Promise.all([
    erroresRegistrados(),
    listarLaboratorios(),
  ])
  const ahora = new Date().toISOString()
  const resumen = resumenDeErrores(errores, ahora)

  const nombreDeLab = new Map(laboratorios.map((l) => [l.id, l.nombre]))
  // Ordenado por urgencia, no por fecha: lo que le pasa a varios laboratorios
  // ahora va antes que lo que ocurrió mucho hace un mes.
  const ordenados = [...errores].sort((a, b) => urgencia(b, ahora) - urgencia(a, ahora))

  return (
    <section className="space-y-4">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent)]">
          Plataforma
        </p>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">Errores</h1>
        <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
          Agrupados por tipo. Un mismo fallo repetido es una sola fila.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Cifra
          etiqueta="Sin resolver"
          valor={resumen.sinResolver}
          tono={resumen.sinResolver > 0 ? 'peligro' : undefined}
        />
        <Cifra etiqueta="Últimas 24 h" valor={resumen.delDia} />
        <Cifra etiqueta="Labs afectados" valor={resumen.laboratoriosAfectados} />
      </div>

      {ordenados.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[15px] font-semibold">Ningún error registrado</p>
          <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
            O todo va bien, o falta correr la migración 0025. Si acabas de correrla, aquí
            aparecerá el primer fallo en cuanto ocurra.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {ordenados.map((e) => {
            const resuelto = e.resuelto_el !== null
            const afectados = e.laboratorios
              // Un id sin nombre es un laboratorio borrado después del fallo.
              // Se muestra recortado en vez de omitirlo: el dato sigue siendo
              // cierto y omitirlo haría que las cifras no cuadraran.
              .map((id) => nombreDeLab.get(id) ?? id.slice(0, 8))
              .sort((a, b) => a.localeCompare(b, 'es'))

            return (
              <li key={e.huella}>
                <Card
                  tono="lista"
                  className={`space-y-2.5 p-3.5 ${resuelto ? 'opacity-55' : ''}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="min-w-0">
                      {/*
                        `donde` primero y en monoespaciado: es el nombre de la
                        función o la ruta del archivo, o sea, la respuesta a
                        «dónde lo arreglo».
                      */}
                      <code className="block break-all text-[13.5px] font-semibold">
                        {e.donde}
                      </code>
                      <span className="mt-0.5 block text-[12.5px] text-[var(--color-muted)]">
                        {hace(e.ultima_vez, ahora)}
                        {e.veces > 1 ? ` · ${e.veces} veces` : ''}
                        {e.codigo ? ` · ${e.codigo}` : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {resuelto ? (
                        <Chip tono="neutro">Resuelto</Chip>
                      ) : afectados.length > 1 ? (
                        <Chip tono="peligro">{afectados.length} labs</Chip>
                      ) : null}
                    </span>
                  </div>

                  {/*
                    El mensaje concreto, ya redactado: los valores que Postgres
                    adjunta se borran antes de guardarlo, porque uno de ellos
                    puede ser el nombre de un paciente.
                  */}
                  <p className="break-words rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 text-[12.5px] leading-relaxed">
                    {e.mensaje}
                  </p>

                  {afectados.length > 0 ? (
                    <p className="text-[12.5px] text-[var(--color-muted)]">
                      {afectados.join(' · ')}
                    </p>
                  ) : null}

                  {resuelto ? (
                    <p className="text-[12.5px] text-[var(--color-muted)]">
                      Marcado resuelto. Si vuelve a ocurrir, reaparece arriba.
                    </p>
                  ) : (
                    <form
                      action={resolverErrorAction}
                      className="border-t border-[var(--color-border)] pt-2.5"
                    >
                      <input type="hidden" name="huella" value={e.huella} />
                      <button
                        type="submit"
                        className="text-[13px] font-semibold text-[var(--color-accent)]"
                      >
                        Marcar resuelto
                      </button>
                    </form>
                  )}
                </Card>
              </li>
            )
          })}
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
  valor: number
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
