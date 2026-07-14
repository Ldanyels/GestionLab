'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'
import { Button } from '@/components/ui/Button'
import { LogoDiente } from '@/components/nav/icons'

const initial: LoginState = { error: '' }

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initial)

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm space-y-5">
        <div className="space-y-2">
          <LogoDiente
            className="text-[var(--color-accent)]"
            width={40}
            height={40}
          />
          <h1 className="text-3xl font-semibold tracking-tight">GestionLab</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Gestión para laboratorios dentales
          </p>
        </div>

        <div className="space-y-3">
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Correo"
            required
            className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]"
          />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            required
            className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </main>
  )
}
