'use client'

import { useActionState } from 'react'

interface Props {
  action: (prev: { error: string }, formData: FormData) => Promise<{ error: string }>
  errorInicial?: string
}

const campo =
  'h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] outline-none focus:border-[var(--color-accent)]'
const etiqueta = 'text-[13px] font-semibold text-[var(--color-muted)]'

/**
 * Contraseña nueva y su confirmación.
 *
 * Campos `type="password"` normales, sin el botón de mostrar que lleva
 * `PasswordInput`: aquí la persona está **eligiendo** una contraseña, no
 * recordándola, y la confirmación ya cumple la función de detectar el error de
 * tecleo.
 */
export function FormularioClaveNueva({ action, errorInicial = '' }: Props) {
  const [state, enviar, pending] = useActionState(action, { error: errorInicial })
  const error = state.error || errorInicial

  return (
    <form action={enviar} className="space-y-3.5">
      <label className="block space-y-1">
        <span className={etiqueta}>Contraseña nueva</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          className={campo}
        />
      </label>

      <label className="block space-y-1">
        <span className={etiqueta}>Repite la contraseña</span>
        <input
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          className={campo}
        />
      </label>

      <p className="text-[12.5px] text-[var(--color-muted)]">
        Debe tener al menos 6 caracteres.
      </p>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-[50px] w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-base font-semibold text-[var(--color-accent-contrast)] transition-transform active:scale-[0.99] disabled:opacity-50"
      >
        {pending ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </form>
  )
}
