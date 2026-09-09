import Link from 'next/link'
import { getSessionPerfil } from '@/lib/auth'
import { veMontos } from '@/lib/permisos'
import { listTrabajos } from '@/lib/trabajos/data'
import { filtrarTrabajos, contarPorEstado } from '@/lib/trabajos/filtro'
import { resolverFiltrosTrabajos, tituloTrabajos } from '@/lib/trabajos/consulta'
import { contarPorPago, filtrarPorPago } from '@/lib/trabajos/pago'
import { contarPorPeriodo, filtrarPorFecha, rangoDePeriodo } from '@/lib/trabajos/periodo'
import { hoyLima } from '@/lib/trabajos/agenda'
import { TrabajoCard } from '@/components/trabajos/TrabajoCard'
import { FiltrosLista } from '@/components/trabajos/FiltrosLista'
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
  const porFecha = (l: readonly TrabajoListItem[]) => filtrarPorFecha(l, rango)

  // El conteo de cada fila se calcula sobre lo que las otras dos ya dejaron
  // pasar, para que ningún número prometa resultados que el filtro combinado
  // no va a devolver.
  const conteoEstado = contarPorEstado(porFecha(porPago(todos)))
  const conteoPago = contarPorPago(porFecha(porEstado(todos)))
  const conteoPeriodo = contarPorPeriodo(porPago(porEstado(todos)), hoy)

  const trabajos = filtrarTrabajos(porFecha(porPago(porEstado(todos))), filtros.q ?? '')

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="titulo-balance min-w-0 text-[28px] font-bold tracking-[-0.03em]">
          {tituloTrabajos(filtros.estado, filtros.pago)}
        </h1>
        <Link
          href="/trabajos/nuevo"
          className="inline-flex h-11 shrink-0 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </div>

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

      <FiltrosLista
        filtros={filtros}
        conteoEstado={conteoEstado}
        conteoPago={conteoPago}
        conteoPeriodo={conteoPeriodo}
      />

      {trabajos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">Sin resultados</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            {todos.length === 0
              ? 'Aún no hay trabajos. Toca «+ Nuevo» para registrar el primero.'
              : 'Ningún trabajo cumple los tres filtros a la vez. Prueba con «Todos», «Cualquiera» o «Todo».'}
          </p>
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
