import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listCatalogo } from '@/lib/catalogo/data'
import { formatMoney } from '@/lib/format'

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ archivados?: string }>
}) {
  await requireAdmin()
  const verArchivados = (await searchParams).archivados === '1'
  const items = await listCatalogo(verArchivados)

  const categorias = [...new Set(items.map((i) => i.categoria))]

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/configuracion" className="text-sm text-[var(--color-muted)]">
            ‹ Configuración
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Catálogo de trabajos</h1>
        </div>
        <Link
          href="/configuracion/catalogo/nuevo"
          className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </div>

      <Link
        href={verArchivados ? '/configuracion/catalogo' : '/configuracion/catalogo?archivados=1'}
        className="inline-block text-sm text-[var(--color-muted)] underline"
      >
        {verArchivados ? '← Ver activos' : 'Ver archivados'}
      </Link>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          {verArchivados
            ? 'No hay trabajos archivados.'
            : 'Aún no hay trabajos. Toca “+ Nuevo” o carga la semilla de MasterLab.'}
        </p>
      ) : (
        <div className="space-y-6">
          {categorias.map((cat) => (
            <div key={cat} className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                {cat}
              </h2>
              <ul className="space-y-2">
                {items
                  .filter((i) => i.categoria === cat)
                  .map((i) => (
                    <li key={i.id}>
                      <Link
                        href={`/configuracion/catalogo/${i.id}`}
                        className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:border-[var(--color-accent)]"
                      >
                        <span className="min-w-0 truncate font-medium">{i.nombre}</span>
                        <span className="shrink-0 text-sm tabular-nums">
                          {formatMoney(i.precio_base)}
                          {i.variable_etiqueta ? (
                            <span className="text-[var(--color-muted)]">
                              {' '}
                              + {formatMoney(i.variable_precio_unitario ?? 0)}/
                              {i.variable_etiqueta}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
