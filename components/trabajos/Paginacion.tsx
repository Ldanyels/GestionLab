import Link from 'next/link'

/**
 * Navegación entre páginas de la lista.
 *
 * Anterior/siguiente y no una fila de números: con 219 páginas —los 6.570
 * trabajos que MasterLab hará en un año— la fila de números no cabe en un
 * teléfono y nadie salta a la página 137 a propósito. Para encontrar algo
 * concreto está el buscador, que ahora filtra en la base.
 */
export function Paginacion({
  pagina,
  totalPaginas,
  hrefDe,
}: {
  pagina: number
  totalPaginas: number
  /** Construye el enlace de una página conservando los filtros activos. */
  hrefDe: (pagina: number) => string
}) {
  // Con una sola página no se muestra nada: unos controles que no llevan a
  // ninguna parte son ruido en la pantalla que más se usa.
  if (totalPaginas <= 1) return null

  const hayAnterior = pagina > 1
  const haySiguiente = pagina < totalPaginas

  const estilo =
    'inline-flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-semibold'

  return (
    <nav
      aria-label="Páginas de trabajos"
      className="flex items-center justify-between gap-3 pt-1"
    >
      {hayAnterior ? (
        <Link href={hrefDe(pagina - 1)} className={estilo} rel="prev">
          ‹ Anterior
        </Link>
      ) : (
        // Un hueco del mismo tamaño para que «Siguiente» no salte de sitio al
        // pasar de la primera página a la segunda.
        <span aria-hidden className="h-11" />
      )}

      <span className="num shrink-0 text-[13px] text-[var(--color-muted)]">
        {pagina} de {totalPaginas}
      </span>

      {haySiguiente ? (
        <Link href={hrefDe(pagina + 1)} className={estilo} rel="next">
          Siguiente ›
        </Link>
      ) : (
        <span aria-hidden className="h-11" />
      )}
    </nav>
  )
}
