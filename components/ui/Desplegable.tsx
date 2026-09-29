import type { ReactNode } from 'react'

/**
 * Un bloque plegado tras una línea que se puede abrir.
 *
 * Para lo que hay que poder hacer pero casi nunca se hace: corregir una fecha,
 * borrar algo mal registrado. Plegado no es escondido —la línea se ve y dice
 * qué hay dentro—, pero deja de competir por el sitio con lo que se usa a
 * diario.
 *
 * Es `<details>` del navegador a propósito: abre y cierra sin JavaScript, así
 * que funciona igual mientras la página se está hidratando y el buscador del
 * navegador (Ctrl+F) encuentra lo de dentro.
 */
export function Desplegable({
  resumen,
  children,
  abierto,
}: {
  /** La línea visible cuando está plegado. */
  resumen: string
  children: ReactNode
  abierto?: boolean
}) {
  return (
    <details open={abierto} className="group">
      <summary className="cursor-pointer list-none text-[13.5px] font-semibold text-[var(--color-muted)] marker:content-['']">
        <span className="inline-block transition-transform group-open:rotate-90">›</span>{' '}
        {resumen}
      </summary>
      <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3.5">
        {children}
      </div>
    </details>
  )
}
