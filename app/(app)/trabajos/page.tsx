import Link from 'next/link'
import { getSessionPerfil } from '@/lib/auth'
import { veMontos } from '@/lib/permisos'
import { listTrabajos } from '@/lib/trabajos/data'
import { filtrarTrabajos, contarPorEstado } from '@/lib/trabajos/filtro'
import { type EstadoTrabajo } from '@/lib/trabajos/estado'
import { TrabajoCard } from '@/components/trabajos/TrabajoCard'
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
  searchParams: Promise<{ estado?: string; q?: string }>
}) {
  const { estado, q } = await searchParams
  const perfil = await getSessionPerfil()
  const montos = veMontos(perfil)
  const filtroEstado = (['en_curso', 'cerrado', 'entregado'] as const).find(
    (e) => e === estado,
  )

  // Se trae la lista completa: permite contar cada filtro y buscar en varios campos.
  const todos = await listTrabajos()
  const conteo = contarPorEstado(todos)
  const trabajos = filtrarTrabajos(
    filtroEstado ? todos.filter((t) => t.estado === filtroEstado) : todos,
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
        hidden={filtroEstado ? { estado: filtroEstado } : undefined}
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTROS.map((f) => {
          const activo = (f.estado ?? undefined) === filtroEstado
          const params = new URLSearchParams()
          if (f.estado) params.set('estado', f.estado)
          if (q) params.set('q', q)
          const qs = params.toString()
          const cuantos = f.estado ? conteo[f.estado] : conteo.todos
          return (
            <Link
              key={f.label}
              href={`/trabajos${qs ? `?${qs}` : ''}`}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm ${
                activo
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] font-semibold text-[var(--color-accent-contrast)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)]'
              }`}
            >
              {f.label}
              <span className="num text-xs opacity-70">{cuantos}</span>
            </Link>
          )
        })}
      </div>

      {trabajos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">Sin resultados</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            {conteo.todos === 0
              ? 'Aún no hay trabajos. Toca «+ Nuevo» para registrar el primero.'
              : 'Cambia el filtro o limpia la búsqueda.'}
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
