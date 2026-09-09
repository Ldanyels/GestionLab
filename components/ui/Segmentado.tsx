import Link from 'next/link'

export interface OpcionSegmento {
  /** Identificador para saber cuál está activa. */
  clave: string
  etiqueta: string
  href: string
  conteo?: number
}

interface Props {
  opciones: OpcionSegmento[]
  activa: string
  /** Para lectores de pantalla: qué se está eligiendo aquí. */
  etiquetaGrupo: string
}

/**
 * Control segmentado: un grupo de opciones excluyentes que se lee como **un
 * solo objeto**, no como varias pastillas sueltas.
 *
 * Es un carril hundido con la opción activa levantada encima. Con cuatro
 * opciones se acomoda en rejilla 2×2 en móvil y en una fila en escritorio: así
 * nada queda cortado ni hay que desplazar lateralmente para descubrir que
 * existía una cuarta opción.
 *
 * Navega por enlaces, sin JavaScript: el filtro vive en la URL.
 */
export function Segmentado({ opciones, activa, etiquetaGrupo }: Props) {
  // Clases literales para que Tailwind las vea: una interpolada no se compila.
  const rejilla = opciones.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'

  return (
    <div
      role="group"
      aria-label={etiquetaGrupo}
      /*
        Ancho completo en móvil, ancho del contenido en escritorio: estirado a
        1300 px cada celda dejaba un hueco enorme entre la etiqueta y su número,
        y el control parecía deshecho en vez de compacto.
      */
      className={`grid w-full ${rejilla} gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1 sm:inline-grid sm:w-auto`}
    >
      {opciones.map((o) => {
        const esActiva = o.clave === activa
        return (
          <Link
            key={o.clave}
            href={o.href}
            aria-current={esActiva ? 'page' : undefined}
            /*
              Etiqueta a la izquierda y número a la derecha, no centrados: en
              móvil las celdas son anchas y un texto centrado en medio de tanto
              espacio parece flotar suelto. Repartidos, la rejilla se lee como
              un selector de dos por dos.
            */
            className={`flex h-9 items-center justify-between gap-2 rounded-[calc(var(--radius-md)-3px)] px-3 text-[13.5px] transition-colors ${
              esActiva
                ? 'bg-[var(--color-accent)] font-semibold text-[var(--color-accent-contrast)] shadow-[var(--shadow-card)]'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
            }`}
          >
            <span className="truncate">{o.etiqueta}</span>
            {o.conteo !== undefined ? (
              <span className="num shrink-0 text-[11.5px] opacity-70">{o.conteo}</span>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
