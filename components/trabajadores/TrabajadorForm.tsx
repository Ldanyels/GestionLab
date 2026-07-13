'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import type { FormState } from '@/app/(app)/configuracion/trabajadores/actions'
import type { Trabajador } from '@/lib/trabajadores/types'

const initial: FormState = { error: '' }
const inputClass =
  'w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'

export function TrabajadorForm({
  action,
  trabajador,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  trabajador?: Trabajador
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, initial)
  return (
    <form action={formAction} className="space-y-4">
      {trabajador ? <input type="hidden" name="id" value={trabajador.id} /> : null}
      <label className="block space-y-1">
        <span className="text-sm text-[var(--color-muted)]">Nombre del trabajador</span>
        <input
          name="nombre"
          required
          defaultValue={trabajador?.nombre ?? ''}
          placeholder="Ej. Luis Torres"
          className={inputClass}
        />
      </label>
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}
