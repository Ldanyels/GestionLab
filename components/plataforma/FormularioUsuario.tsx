'use client'

import { useActionState } from 'react'

interface Props {
  labId: string
  action: (prev: { error: string }, formData: FormData) => Promise<{ error: string }>
  errorInicial?: string
}

const campo =
  'h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] outline-none focus:border-[var(--color-accent)]'
const etiqueta = 'text-[13px] font-semibold text-[var(--color-muted)]'

/**
 * Alta de un usuario en un laboratorio ajeno, desde el panel.
 *
 * No reutiliza `components/usuarios/UsuarioForm` porque ese importa su acción
 * directamente y siempre crea en el laboratorio de la sesión, que es justo lo
 * que aquí no sirve: el operador no pertenece a ninguno.
 */
export function FormularioUsuario({ labId, action, errorInicial = '' }: Props) {
  const [state, enviar, pending] = useActionState(action, { error: errorInicial })
  const error = state.error || errorInicial

  return (
    <form action={enviar} className="space-y-3.5">
      <input type="hidden" name="laboratorio_id" value={labId} />

      <label className="block space-y-1">
        <span className={etiqueta}>Nombre</span>
        <input name="nombre" type="text" maxLength={120} required className={campo} />
      </label>

      <label className="block space-y-1">
        <span className={etiqueta}>Correo (para iniciar sesión)</span>
        <input
          name="email"
          type="email"
          autoComplete="off"
          autoCapitalize="none"
          required
          className={campo}
        />
      </label>

      <label className="block space-y-1">
        <span className={etiqueta}>Contraseña inicial</span>
        {/* Visible: quien da el alta tiene que poder dictarla. */}
        <input
          name="password"
          type="text"
          autoComplete="off"
          minLength={6}
          required
          className={campo}
        />
      </label>

      <label className="block space-y-1">
        <span className={etiqueta}>Rol</span>
        <select name="rol" defaultValue="tecnico" className={campo}>
          <option value="tecnico">Técnico (registra trabajos; sin finanzas ni inventario)</option>
          <option value="admin">Administrador (acceso total en su laboratorio)</option>
        </select>
      </label>

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
        {pending ? 'Creando…' : 'Crear usuario'}
      </button>
    </form>
  )
}
