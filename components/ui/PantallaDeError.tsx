import Link from 'next/link'

interface Props {
  titulo?: string
  explicacion?: string
  /** Identificador que genera Next en producción; sirve para cruzarlo con el registro. */
  digest?: string
  /** Mensaje técnico. Solo se pasa en desarrollo: en producción no debe filtrarse. */
  detalle?: string
  /** Si se pasa, aparece el botón de reintentar (el `reset` de Next). */
  onReintentar?: () => void
  hrefSalida?: string
  etiquetaSalida?: string
}

/**
 * Pantalla compartida por todos los límites de error y por el 404.
 *
 * Presentacional a propósito: recibe el detalle técnico por prop en vez de
 * leer `process.env.NODE_ENV`, para que sea comprobable y para que no exista
 * ninguna ruta por la que el mensaje crudo llegue al usuario en producción.
 */
export function PantallaDeError({
  titulo = 'Algo salió mal',
  explicacion = 'No pudimos completar la operación. Vuelve a intentarlo; si sigue pasando, avisa al administrador.',
  digest,
  detalle,
  onReintentar,
  hrefSalida = '/hoy',
  etiquetaSalida = 'Ir a Hoy',
}: Props) {
  return (
    <section className="mx-auto flex max-w-[520px] flex-col items-center px-4 py-14 text-center">
      <span
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger-soft)]"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-danger)"
          strokeWidth="1.9"
          strokeLinecap="round"
        >
          <path d="M12 9v5M12 17.5v.01" />
          <path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </span>

      <h1 className="titulo-balance mt-4 text-[22px] font-bold leading-tight">{titulo}</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--color-muted)]">{explicacion}</p>

      <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
        {onReintentar ? (
          <button
            type="button"
            onClick={onReintentar}
            className="h-11 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 text-[15px] font-semibold text-[var(--color-accent-contrast)] sm:min-w-[170px]"
          >
            Volver a intentar
          </button>
        ) : null}
        <Link
          href={hrefSalida}
          className="flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 text-[15px] font-semibold sm:min-w-[150px]"
        >
          {etiquetaSalida}
        </Link>
      </div>

      {digest ? (
        <p className="mt-7 text-[12.5px] text-[var(--color-muted)]">
          Código del error:{' '}
          <span className="num select-all rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] px-1.5 py-0.5">
            {digest}
          </span>
          <span className="mt-1 block">Menciónalo si necesitas reportarlo.</span>
        </p>
      ) : null}

      {detalle ? (
        <pre className="num mt-5 max-w-full overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-left text-[12px] leading-relaxed">
          Detalle técnico (solo en desarrollo):{'\n'}
          {detalle}
        </pre>
      ) : null}
    </section>
  )
}
