'use client'

import { useConexion } from './useConexion'

/**
 * Barra de «sin conexión», visible en toda la aplicación.
 *
 * Va fija abajo y por encima de la navegación: es donde está el pulgar y donde
 * se mira antes de tocar «Guardar». Arriba, en móvil, competiría con el
 * encabezado y se perdería al desplazarse.
 *
 * Dice qué hacer, no solo qué pasa. «Sin conexión» a secas deja al técnico
 * decidiendo si volver a intentar o si perdió lo que escribió.
 */
export function AvisoSinConexion() {
  const enLinea = useConexion()
  if (enLinea) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-[86px] z-30 mx-auto max-w-[880px] px-4 min-[980px]:bottom-4"
    >
      <p className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2.5 text-[13px] font-semibold leading-snug shadow-lg">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="shrink-0 text-[var(--color-danger)]"
          aria-hidden
        >
          <path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 3-2M19 13a10 10 0 0 0-7-3M12 20h.01" />
        </svg>
        <span>
          Sin conexión. No se guardará nada hasta que vuelva; lo que escribiste
          sigue en pantalla.
        </span>
      </p>
    </div>
  )
}
