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
 * Alta de un laboratorio con su primer administrador.
 *
 * Los nombres de los campos coinciden con `laboratorioNuevoSchema`, así que la
 * Server Action puede pasar el `FormData` al esquema sin traducir nada.
 */
export function FormularioLaboratorio({ action, errorInicial = '' }: Props) {
  const [state, enviar, pending] = useActionState(action, { error: errorInicial })
  const error = state.error || errorInicial

  return (
    <form action={enviar} className="space-y-5">
      <fieldset className="space-y-3.5">
        <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent)]">
          Laboratorio
        </legend>
        <label className="block space-y-1">
          <span className={etiqueta}>Nombre del laboratorio</span>
          <input name="laboratorio" type="text" maxLength={120} required className={campo} />
        </label>
      </fieldset>

      <fieldset className="space-y-3.5">
        <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent)]">
          Su administrador
        </legend>

        <label className="block space-y-1">
          <span className={etiqueta}>Nombre del administrador</span>
          <input name="adminNombre" type="text" maxLength={120} required className={campo} />
        </label>

        <label className="block space-y-1">
          <span className={etiqueta}>Correo del administrador</span>
          <input
            name="adminEmail"
            type="email"
            autoComplete="off"
            autoCapitalize="none"
            required
            className={campo}
          />
        </label>

        <label className="block space-y-1">
          <span className={etiqueta}>Contraseña inicial</span>
          <input
            name="adminPassword"
            type="text"
            autoComplete="off"
            minLength={6}
            required
            className={campo}
          />
        </label>
        {/* Visible a propósito: quien da el alta tiene que poder dictarla o
            copiarla para entregarla. Ocultarla obligaría a teclearla dos veces
            a ciegas para una clave que además es temporal. */}
        <p className="text-[12.5px] text-[var(--color-muted)]">
          Mínimo 6 caracteres. Se la entregas al laboratorio y él la cambia desde su
          perfil.
        </p>
      </fieldset>

      <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
        El laboratorio arranca <strong className="font-semibold">sin catálogo</strong>, sin
        consultorios y sin productos. Su administrador los crea desde Configuración.
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
        {pending ? 'Creando…' : 'Crear laboratorio'}
      </button>
    </form>
  )
}
