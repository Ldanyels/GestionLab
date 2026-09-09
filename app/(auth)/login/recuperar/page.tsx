'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { pedirEnlaceAction, type RecuperarState } from './actions'
import { LogoDiente } from '@/components/nav/icons'

const initial: RecuperarState = { error: '', enviado: false }

const campo =
  'h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] outline-none focus:border-[var(--color-accent)]'

export default function RecuperarPage() {
  const [state, action, pending] = useActionState(pedirEnlaceAction, initial)

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <LogoDiente className="text-[var(--color-accent)]" width={24} height={24} />
          GestionLab
        </span>

        {state.enviado ? (
          <>
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
              Revisa tu correo
            </h1>
            {/*
              El texto no confirma ni niega que la cuenta exista: si lo hiciera,
              esta pantalla serviría para averiguar quién tiene acceso al
              sistema.
            */}
            <p className="text-[14.5px] leading-relaxed text-[var(--color-muted)]">
              Si esa dirección tiene una cuenta, te llegará un enlace para elegir una
              contraseña nueva. Vence en una hora y solo se puede usar una vez.
            </p>
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[15px] font-semibold"
            >
              Volver a entrar
            </Link>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
                Recuperar contraseña
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Te mandamos un enlace al correo con el que entras.
              </p>
            </div>

            <form action={action} className="space-y-3.5">
              <label className="block space-y-1">
                <span className="text-[13px] font-semibold text-[var(--color-muted)]">
                  Correo
                </span>
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
                {pending ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>

            <Link
              href="/login"
              className="block border-t border-[var(--color-border)] pt-3.5 text-[13px] text-[var(--color-accent)]"
            >
              ‹ Volver a entrar
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
