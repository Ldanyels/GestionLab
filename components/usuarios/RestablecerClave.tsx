'use client'

import { useActionState, useState } from 'react'
import { restablecerClaveAction } from '@/app/(app)/configuracion/usuarios/actions'

const campo =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'

/**
 * Restablece la contraseña de un usuario del laboratorio.
 *
 * Empieza cerrado a propósito: la pantalla de usuarios tiene una fila por
 * persona, y desplegar dos campos y dos botones en cada una la convertiría en
 * un muro de formularios.
 */
export function RestablecerClave({
  usuarioId,
  nombre,
}: {
  usuarioId: string
  nombre: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [state, action, pending] = useActionState(restablecerClaveAction, { error: '' })

  if (abierto && state.ok) {
    return <p className="text-xs text-[var(--color-success)]">Contraseña actualizada.</p>
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-xs text-[var(--color-accent)]"
      >
        Restablecer contraseña
      </button>
    )
  }

  return (
    <form action={action} className="w-full space-y-2">
      <input type="hidden" name="id" value={usuarioId} />
      <p className="text-xs text-[var(--color-muted)]">
        Contraseña nueva para <span className="font-semibold">{nombre}</span>
      </p>

      <input
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        required
        placeholder="Contraseña nueva"
        aria-label="Contraseña nueva"
        className={campo}
      />

      <input
        name="confirmacion"
        type="password"
        autoComplete="new-password"
        minLength={6}
        required
        placeholder="Repítela"
        aria-label="Repite la contraseña"
        className={campo}
      />

      {state.error ? (
        <p role="alert" className="text-xs text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-9 flex-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-xs font-semibold text-[var(--color-accent-contrast)] disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-xs"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
