import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listCatalogo } from '@/lib/catalogo/data'
import { filtrarTipos } from '@/lib/catalogo/filtro'
import { formatMoney } from '@/lib/format'
import { BackRow } from '@/components/ui/BackRow'
import { SearchBox } from '@/components/ui/SearchBox'
import type { CatalogoTrabajo } from '@/lib/catalogo/types'
import { moverCatalogoAction } from './actions'

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ archivados?: string; q?: string }>
}) {
  await requireAdmin()
  const { archivados, q } = await searchParams
  const verArchivados = archivados === '1'
  const todos = await listCatalogo(verArchivados)
  const items = filtrarTipos(todos, q ?? '')
  const buscando = Boolean(q?.trim())

  const categorias = [...new Set(items.map((i) => i.categoria))]

  return (
    <section className="mx-auto max-w-[620px] space-y-4">
      <div className="flex items-start justify-between gap-3">
        <BackRow
          href="/configuracion"
          titulo="Catálogo de trabajos"
          migaDePan="Configuración"
        />
        <Link
          href="/configuracion/catalogo/nuevo"
          className="mt-1 inline-flex h-11 shrink-0 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </div>

      <SearchBox
        placeholder="Buscar tipo de trabajo…"
        defaultValue={q}
        hidden={verArchivados ? { archivados: '1' } : undefined}
      />

      <Link
        href={
          verArchivados ? '/configuracion/catalogo' : '/configuracion/catalogo?archivados=1'
        }
        className="inline-block text-[13.5px] text-[var(--color-muted)] underline"
      >
        {verArchivados ? '← Ver activos' : 'Ver archivados'}
      </Link>

      {buscando ? (
        <p className="text-[12.5px] text-[var(--color-muted)]">
          Limpia la búsqueda para reordenar los trabajos.
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">
            {buscando ? 'Sin resultados' : verArchivados ? 'Sin archivados' : 'Sin trabajos'}
          </p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            {buscando
              ? 'Prueba con otro nombre o categoría.'
              : 'Toca «+ Nuevo» o carga la semilla de MasterLab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {categorias.map((cat) => {
            const lista = items.filter((i) => i.categoria === cat)
            return (
              <div key={cat} className="space-y-1.5">
                <h2 className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  {cat}
                </h2>
                <ul className="space-y-1.5">
                  {lista.map((i, idx) => (
                    <li key={i.id} className="flex items-stretch gap-1.5">
                      <Link
                        href={`/configuracion/catalogo/${i.id}`}
                        className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 transition-colors hover:border-[var(--color-accent)]"
                      >
                        <span className="min-w-0 truncate text-[14.5px] font-medium">
                          {i.nombre}
                        </span>
                        <span className="shrink-0 text-right">
                          {i.variable_etiqueta ? (
                            <span className="num mr-2 text-[11.5px] text-[var(--color-muted)]">
                              + {formatMoney(i.variable_precio_unitario ?? 0)} /{' '}
                              {i.variable_etiqueta}
                            </span>
                          ) : null}
                          <span className="num text-[14.5px] font-bold">
                            {formatMoney(i.precio_base)}
                          </span>
                        </span>
                      </Link>
                      {!verArchivados && !buscando ? (
                        <span className="flex flex-col justify-center gap-[3px]">
                          <MoverBtn item={i} vecino={lista[idx - 1]} direccion="arriba" />
                          <MoverBtn item={i} vecino={lista[idx + 1]} direccion="abajo" />
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/** Flecha de reorden: intercambia el orden con el vecino de su categoría. */
function MoverBtn({
  item,
  vecino,
  direccion,
}: {
  item: CatalogoTrabajo
  vecino?: CatalogoTrabajo
  direccion: 'arriba' | 'abajo'
}) {
  const icono = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d={direccion === 'arriba' ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
    </svg>
  )
  const base =
    'flex h-6 w-[38px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)]'

  // Sin vecino la flecha queda visible pero atenuada: la fila no cambia de tamaño.
  if (!vecino) {
    return (
      <span aria-hidden className={`${base} text-[var(--color-border)] opacity-30`}>
        {icono}
      </span>
    )
  }
  return (
    <form action={moverCatalogoAction}>
      <input type="hidden" name="a_id" value={item.id} />
      <input type="hidden" name="a_orden" value={item.orden} />
      <input type="hidden" name="b_id" value={vecino.id} />
      <input type="hidden" name="b_orden" value={vecino.orden} />
      <button
        type="submit"
        aria-label={`${direccion === 'arriba' ? 'Subir' : 'Bajar'} ${item.nombre}`}
        className={`${base} text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]`}
      >
        {icono}
      </button>
    </form>
  )
}
