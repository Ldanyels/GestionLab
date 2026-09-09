import Link from 'next/link'
import { getSessionPerfil } from '@/lib/auth'
import { veMontos } from '@/lib/permisos'
import { listTrabajos } from '@/lib/trabajos/data'
import { filtrarTrabajos, contarPorEstado } from '@/lib/trabajos/filtro'
import {
  contarPorPeriodo,
  enlaceTrabajos,
  filtrarPorFecha,
  rangoDePeriodo,
  resolverPeriodo,
} from '@/lib/trabajos/periodo'
import { hoyLima } from '@/lib/trabajos/agenda'
import { type EstadoTrabajo } from '@/lib/trabajos/estado'
import { TrabajoCard } from '@/components/trabajos/TrabajoCard'
import { FiltroFecha } from '@/components/trabajos/FiltroFecha'
import { PastillaFiltro } from '@/components/ui/PastillaFiltro'
import { SearchBox } from '@/components/ui/SearchBox'

const FILTROS: { label: string; estado?: EstadoTrabajo }[] = [
  { label: 'Todos' },
  { label: 'En curso', estado: 'en_curso' },
  { label: 'Cerrados', estado: 'cerrado' },
  { label: 'Entregados', estado: 'entregado' },
]

export default async function TrabajosPage({
  searchParams,
}: {
  searchParams: Promise<{
    estado?: string
    q?: string
    periodo?: string
    desde?: string
    hasta?: string
  }>
}) {
  const sp = await searchParams
  const { estado, q, desde, hasta } = sp
  const perfil = await getSessionPerfil()
  const montos = veMontos(perfil)
  const filtroEstado = (['en_curso', 'cerrado', 'entregado'] as const).find(
    (e) => e === estado,
  )
  const periodo = resolverPeriodo(sp.periodo)
  const hoy = hoyLima()
  const rango = rangoDePeriodo(periodo, hoy, desde, hasta)

  // Se trae la lista completa: permite contar cada filtro y buscar en varios campos.
  const todos = await listTrabajos()

  // Los conteos de cada fila se calculan sobre lo que la otra fila ya dejó
  // pasar, para que los números no prometan resultados que el filtro combinado
  // no va a devolver.
  const conteo = contarPorEstado(filtrarPorFecha(todos, rango))
  const conteoPeriodo = contarPorPeriodo(
    filtroEstado ? todos.filter((t) => t.estado === filtroEstado) : todos,
    hoy,
  )

  const trabajos = filtrarTrabajos(
    filtrarPorFecha(
      filtroEstado ? todos.filter((t) => t.estado === filtroEstado) : todos,
      rango,
    ),
    q ?? '',
  )

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold tracking-[-0.03em]">Trabajos</h1>
        <Link
          href="/trabajos/nuevo"
          className="inline-flex h-11 shrink-0 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </div>

      <SearchBox
        placeholder="Buscar por paciente, doctor o tipo…"
        defaultValue={q}
        hidden={{
          ...(filtroEstado ? { estado: filtroEstado } : {}),
          ...(periodo !== 'todo' ? { periodo } : {}),
          ...(periodo === 'rango' && desde ? { desde } : {}),
          ...(periodo === 'rango' && hasta ? { hasta } : {}),
        }}
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTROS.map((f) => (
          <PastillaFiltro
            key={f.label}
            href={enlaceTrabajos({ estado: f.estado, q, periodo, desde, hasta })}
            activa={(f.estado ?? undefined) === filtroEstado}
            conteo={f.estado ? conteo[f.estado] : conteo.todos}
          >
            {f.label}
          </PastillaFiltro>
        ))}
      </div>

      <FiltroFecha
        periodo={periodo}
        desde={desde}
        hasta={hasta}
        conteo={conteoPeriodo}
        estado={filtroEstado}
        q={q}
      />

      {trabajos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">Sin resultados</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            {todos.length === 0
              ? 'Aún no hay trabajos. Toca «+ Nuevo» para registrar el primero.'
              : 'Cambia el estado, prueba otro periodo o limpia la búsqueda.'}
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
