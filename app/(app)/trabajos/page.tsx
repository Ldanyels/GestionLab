import Link from 'next/link'
import { getSessionPerfil } from '@/lib/auth'
import { veMontos } from '@/lib/permisos'
import { listTrabajos } from '@/lib/trabajos/data'
import { filtrarTrabajos, contarPorEstadoEnPeriodo } from '@/lib/trabajos/filtro'
import { resolverFiltrosTrabajos, tituloTrabajos } from '@/lib/trabajos/consulta'
import { contarPorPago, filtrarPorPago } from '@/lib/trabajos/pago'
import { campoFechaDe, filtrarPorFecha, rangoDePeriodo } from '@/lib/trabajos/periodo'
import { resumenLista } from '@/lib/trabajos/resumen-lista'
import { hoyLima } from '@/lib/trabajos/agenda'
import { TrabajoCard } from '@/components/trabajos/TrabajoCard'
import { BarraFiltros } from '@/components/trabajos/BarraFiltros'
import { SearchBox } from '@/components/ui/SearchBox'
import type { TrabajoListItem } from '@/lib/trabajos/types'

export default async function TrabajosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filtros = resolverFiltrosTrabajos(await searchParams)
  const perfil = await getSessionPerfil()
  const montos = veMontos(perfil)
  const hoy = hoyLima()
  const rango = rangoDePeriodo(filtros.periodo, hoy, filtros.desde, filtros.hasta)

  // Se trae la lista completa: permite contar cada filtro y buscar en varios campos.
  const todos = await listTrabajos()

  const porEstado = (l: readonly TrabajoListItem[]) =>
    filtros.estado ? l.filter((t) => t.estado === filtros.estado) : [...l]
  const porPago = (l: readonly TrabajoListItem[]) => filtrarPorPago(l, filtros.pago)
  // Viendo entregados, el periodo acota por la fecha real de salida; en el
  // resto, por la de ingreso. Ver `campoFechaDe`.
  const campoFecha = campoFechaDe(filtros.estado)
  const porFecha = (l: readonly TrabajoListItem[]) => filtrarPorFecha(l, rango, campoFecha)

  // El conteo de cada control se calcula sobre lo que los otros ya dejaron
  // pasar, para que ningún número prometa resultados que el filtro combinado
  // no va a devolver.
  // El de estado usa su propio conteo: cada estado se filtra por una fecha
  // distinta, así que no puede calcularse sobre una lista ya filtrada por una
  // sola de ellas.
  const conteoEstado = contarPorEstadoEnPeriodo(porPago(todos), rango)
  const conteoPago = contarPorPago(porFecha(porEstado(todos)))

  const trabajos = filtrarTrabajos(porFecha(porPago(porEstado(todos))), filtros.q ?? '')
  const resumen = resumenLista(trabajos, montos)

  return (
    <section className="space-y-4">
      <header>
        <div className="flex items-start justify-between gap-3">
          <h1 className="titulo-balance min-w-0 text-[28px] font-bold leading-tight tracking-[-0.03em]">
            {tituloTrabajos(filtros.estado, filtros.pago)}
          </h1>
          <Link
            href="/trabajos/nuevo"
            className="inline-flex h-11 shrink-0 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
          >
            + Nuevo
          </Link>
        </div>

        {/*
          La línea que faltaba. Filtrar «entregados por cobrar» y leer "12" no
          responde nada en un laboratorio que trabaja a crédito: la pregunta es
          cuánto. El dato ya venía cargado.

          Va fuera de la fila del botón para disponer del ancho completo: dentro
          competía con «+ Nuevo» y el importe se partía dejando «por cobrar»
          solo en la segunda línea. Y solo las cifras van en monoespaciada; las
          palabras en la tipografía del texto, que es más estrecha.
        */}
        {resumen.conteo ? (
          <p className="mt-1.5 text-[13.5px] text-[var(--color-muted)]">
            {resumen.conteo}
            {resumen.monto ? (
              <>
                <span aria-hidden className="px-1.5 opacity-50">
                  ·
                </span>
                <span
                  className={`font-semibold ${
                    resumen.hayDeuda
                      ? 'text-[var(--color-danger)]'
                      : 'text-[var(--color-success)]'
                  }`}
                >
                  {resumen.monto}
                </span>
              </>
            ) : null}
          </p>
        ) : null}
      </header>

      <SearchBox
        placeholder="Buscar por paciente, doctor o tipo…"
        defaultValue={filtros.q}
        hidden={{
          ...(filtros.estado ? { estado: filtros.estado } : {}),
          ...(filtros.pago !== 'cualquiera' ? { pago: filtros.pago } : {}),
          ...(filtros.periodo !== 'todo' ? { periodo: filtros.periodo } : {}),
          ...(filtros.desde ? { desde: filtros.desde } : {}),
          ...(filtros.hasta ? { hasta: filtros.hasta } : {}),
        }}
      />

      <BarraFiltros filtros={filtros} conteoEstado={conteoEstado} conteoPago={conteoPago} />

      {trabajos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[15px] font-semibold">
            {todos.length === 0 ? 'Aún no hay trabajos' : 'Nada con estos filtros'}
          </p>
          <p className="mx-auto mt-1 max-w-[34ch] text-[13.5px] leading-relaxed text-[var(--color-muted)]">
            {todos.length === 0
              ? 'Toca «+ Nuevo» para registrar el primero.'
              : 'Ningún trabajo cumple los tres a la vez.'}
          </p>
          {todos.length > 0 ? (
            <Link
              href="/trabajos"
              className="mt-4 inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-[13.5px] font-semibold"
            >
              Quitar los filtros
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {trabajos.map((t) => (
            <li key={t.id}>
              <TrabajoCard trabajo={t} montos={montos} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
