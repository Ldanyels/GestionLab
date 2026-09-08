'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoDiente } from '@/components/nav/icons'

const initial: LoginState = { error: '' }

const campo =
  'h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] outline-none focus:border-[var(--color-accent)]'
const etiqueta = 'text-[13px] font-semibold text-[var(--color-muted)]'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initial)

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <LogoDiente className="text-[var(--color-accent)]" width={24} height={24} />
          GestionLab
        </span>

        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">
            Entrar al laboratorio
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Gestión de trabajos, cobranza e insumos.
          </p>
        </div>

        <form action={action} className="space-y-3.5">
          <label className="block space-y-1">
            <span className={etiqueta}>Correo</span>
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              required
              className={campo}
            />
          </label>

          <label className="block space-y-1">
            <span className={etiqueta}>Contraseña</span>
            <PasswordInput required placeholder="••••••••" />
          </label>

          {state.error ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="h-[50px] w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-base font-semibold text-[var(--color-accent-contrast)] transition-transform active:scale-[0.99] disabled:opacity-50"
          >
            {pending ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3.5">
          <p className="text-[13px] text-[var(--color-muted)]">
            ¿Olvidaste tu contraseña? Pídele al administrador que la restablezca.
          </p>
          <ThemeToggle />
        </div>
      </div>
    </main>
  )
}
