'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import type { FormState } from '@/app/(app)/consultorios/actions'
import type { Consultorio } from '@/lib/consultorios/types'

const initial: FormState = { error: '' }
const inputClass =
  'w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'

interface Props {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  consultorio?: Consultorio
  submitLabel: string
}

export function ConsultorioForm({ action, consultorio, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initial)

  return (
    <form action={formAction} className="space-y-4">
      {consultorio ? (
        <input type="hidden" name="id" value={consultorio.id} />
      ) : null}
      <label className="block space-y-1">
        <span className="text-sm text-[var(--color-muted)]">Nombre</span>
        <input
          name="nombre"
          required
          defaultValue={consultorio?.nombre ?? ''}
          placeholder="Ej. Clínica Dental Sonrisa"
          className={inputClass}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-[var(--color-muted)]">Contacto (opcional)</span>
        <input
          name="contacto"
          defaultValue={consultorio?.contacto ?? ''}
          placeholder="Teléfono, correo…"
          className={inputClass}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-[var(--color-muted)]">Notas (opcional)</span>
        <textarea
          name="notas"
          rows={3}
          defaultValue={consultorio?.notas ?? ''}
          className={`${inputClass} h-auto py-2`}
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
