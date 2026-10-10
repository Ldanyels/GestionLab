'use client'

import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  abierta: boolean
  onCerrar: () => void
  titulo: string
  children: ReactNode
  /**
   * Lo que no se desplaza con el contenido: hoy, el buscador.
   *
   * Va aquí y no dentro de `children` porque metido en la zona que hace scroll
   * se iba de la pantalla en cuanto la lista era larga, y había que subir para
   * corregir lo escrito.
   */
  fijo?: ReactNode
  /** Ancho máximo del panel. 560 px para selección, 420 px para confirmar. */
  anchoMax?: number
}

interface AreaVisible {
  top: number
  height: number
}

/**
 * La parte de la pantalla que el teclado del teléfono **no** está tapando.
 *
 * `position: fixed` y `100vh` miden la ventana de maquetación, y esa no encoge
 * cuando sale el teclado: una hoja anclada abajo queda justo debajo de las
 * teclas. Se notaba al escribir en el buscador —la lista se acortaba, la hoja
 * se encogía pegada al borde inferior y los nombres quedaban ocultos tras el
 * teclado, que es justo cuando hacen falta.
 *
 * `visualViewport` sí mide lo que se ve. Devuelve `null` donde no existe
 * —escritorio antiguo, pruebas— y entonces la hoja se comporta como siempre.
 */
function useAreaVisible(activo: boolean): AreaVisible | null {
  const [area, setArea] = useState<AreaVisible | null>(null)

  useEffect(() => {
    if (!activo) {
      setArea(null)
      return
    }
    const vv = typeof window === 'undefined' ? null : window.visualViewport
    if (!vv) return

    const medir = () => setArea({ top: vv.offsetTop, height: vv.height })
    medir()
    // `scroll` además de `resize`: en iOS el teclado desplaza la página en vez
    // de encogerla, y sin esto la hoja se quedaría donde estaba.
    vv.addEventListener('resize', medir)
    vv.addEventListener('scroll', medir)
    return () => {
      vv.removeEventListener('resize', medir)
      vv.removeEventListener('scroll', medir)
    }
  }, [activo])

  return area
}

export function Sheet({ abierta, onCerrar, titulo, children, fijo, anchoMax = 560 }: Props) {
  const area = useAreaVisible(abierta)

  useEffect(() => {
    if (!abierta) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierta, onCerrar])

  if (!abierta) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={onCerrar}
      /*
        El fondo se ciñe a lo que se ve. Con el teclado fuera, `items-end`
        apoya la hoja en el borde de lo visible —encima de las teclas— y no en
        el de la ventana, que está debajo de ellas.
      */
      style={area ? { top: area.top, height: area.height, bottom: 'auto' } : undefined}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(10,13,18,0.5)] sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        /*
          En el teléfono la hoja tiene **alto fijo**, no el de su contenido.

          Era lo que faltaba. Creciendo con la lista, al escribir en el buscador
          la lista se acortaba, la hoja se encogía —sigue apoyada abajo— y se
          quedaba en el título y el campo: el hueco de los nombres se iba a
          cero justo cuando se estaba buscando. Con alto fijo la hoja no se
          mueve mientras se teclea y la lista conserva su sitio; lo que cambia
          es lo que se desplaza dentro.

          `min()` porque con el teclado guardado lo visible es la pantalla
          entera, y el 82 % deja ver lo que hay detrás, que es lo que distingue
          una hoja de una pantalla nueva. Con el teclado fuera gana el alto
          visible y la hoja ocupa todo lo que queda, que es lo que hace falta.

          En pantalla grande no aplica (`sm:h-auto`): ahí no hay teclado que
          tape nada y una hoja medio vacía se ve peor que una ajustada.
        */
        style={{
          maxWidth: anchoMax,
          ['--alto-hoja' as string]: area
            ? `min(82vh, ${Math.round(area.height)}px)`
            : '82vh',
        }}
        className="flex h-[var(--alto-hoja)] max-h-[var(--alto-hoja)] w-full flex-col rounded-t-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-pop)] motion-safe:animate-[sheetIn_220ms_ease-out] sm:h-auto sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] p-4">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCerrar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-muted)]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {fijo ? (
          <div className="shrink-0 border-b border-[var(--color-border)] px-4 py-3">{fijo}</div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
