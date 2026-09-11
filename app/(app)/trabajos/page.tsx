import Link from 'next/link'
import { getSessionPerfil } from '@/lib/auth'
import { veMontos } from '@/lib/permisos'
import { paginaDeTrabajos, saldosFiltrados } from '@/lib/trabajos/pagina'
import { totalDePaginas } from '@/lib/trabajos/listado'
import { resolverFiltrosTrabajos, tituloTrabajos } from '@/lib/trabajos/consulta'
import { rangoDePeriodo } from '@/lib/trabajos/periodo'
import { resumenDeConsulta } from '@/lib/trabajos/resumen-lista'
import { hoyLima } from '@/lib/trabajos/agenda'
import { TrabajoCard } from '@/components/trabajos/TrabajoCard'
import { BarraFiltros } from '@/components/trabajos/BarraFiltros'
import { SearchBox } from '@/components/ui/SearchBox'
import { Paginacion } from '@/components/trabajos/Paginacion'

export default async function TrabajosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const filtros = resolverFiltrosTrabajos(params)
  const perfil = await getSessionPerfil()
  const montos = veMontos(perfil)
  const hoy = hoyLima()
  const rango = rangoDePeriodo(filtros.periodo, hoy, filtros.desde, filtros.hasta)
  const pagina = Number(params.pagina ?? 1) || 1

  /*
    Todo el filtrado ocurre en la base.

    Antes esta pantalla descargaba la lista completa —0,97 KB por trabajo— para
    poder contar cada filtro y buscar en varios campos. Con 18 trabajos diarios
    eso llegaba a 5,7 MB por carga en un año, y esa descarga la paga el teléfono
    del técnico. Ahora viajan solo los treinta que se ven; los contadores son
    consultas que no devuelven ninguna fila.
  */
  // `estado` llega como `undefined` cuando no hay filtro; la consulta usa
  // `null` para ese caso, que es lo que distingue «sin filtrar» de un valor.
  const consulta = {
    estado: filtros.estado ?? null,
    pago: filtros.pago,
    rango,
    q: filtros.q ?? '',
  }
  const { trabajos, total, conteoEstado, conteoPago } = await paginaDeTrabajos(
    consulta,
    pagina,
  )

  // Los saldos solo se piden a quien ve importes: para un técnico sin ese
  // permiso, el resumen no lleva dinero y la consulta sobraría.
  const resumen = resumenDeConsulta(total, montos ? await saldosFiltrados(consulta) : [], montos)
  const totalPaginas = totalDePaginas(total)

  /** Enlace a otra página conservando los filtros y la búsqueda. */
  const hrefDePagina = (p: number) => {
    const q = new URLSearchParams()
    if (filtros.estado) q.set('estado', filtros.estado)
    if (filtros.pago !== 'cualquiera') q.set('pago', filtros.pago)
    if (filtros.periodo !== 'todo') q.set('periodo', filtros.periodo)
    if (filtros.desde) q.set('desde', filtros.desde)
    if (filtros.hasta) q.set('hasta', filtros.hasta)
    if (filtros.q) q.set('q', filtros.q)
    if (p > 1) q.set('pagina', String(p))
    const cadena = q.toString()
    return cadena ? `/trabajos?${cadena}` : '/trabajos'
  }

  // «Aún no hay trabajos» solo cuando de verdad no hay ninguno, no cuando los
  // filtros no dejaron pasar nada: son mensajes con salidas distintas.
  const hayFiltros =
    Boolean(filtros.estado) ||
    filtros.pago !== 'cualquiera' ||
    filtros.periodo !== 'todo' ||
    Boolean(filtros.q)

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
            {hayFiltros ? 'Nada con estos filtros' : 'Aún no hay trabajos'}
          </p>
          <p className="mx-auto mt-1 max-w-[34ch] text-[13.5px] leading-relaxed text-[var(--color-muted)]">
            {hayFiltros
              ? 'Ningún trabajo cumple los tres a la vez.'
              : 'Toca «+ Nuevo» para registrar el primero.'}
          </p>
          {hayFiltros ? (
            <Link
              href="/trabajos"
              className="mt-4 inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-[13.5px] font-semibold"
            >
              Quitar los filtros
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="space-y-2.5">
            {trabajos.map((t) => (
              <li key={t.id}>
                <TrabajoCard trabajo={t} montos={montos} hoy={hoy} />
              </li>
            ))}
          </ul>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} hrefDe={hrefDePagina} />
        </>
      )}
    </section>
  )
}
