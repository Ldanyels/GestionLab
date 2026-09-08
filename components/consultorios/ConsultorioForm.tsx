'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { CAMPO, ETIQUETA } from '@/components/ui/campos'
import type { FormState } from '@/app/(app)/consultorios/actions'
import type { Consultorio } from '@/lib/consultorios/types'

const initial: FormState = { error: '' }

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
        <span className={ETIQUETA}>Nombre</span>
        <input
          name="nombre"
          required
          defaultValue={consultorio?.nombre ?? ''}
          placeholder="Ej. Clínica Dental Sonrisa"
          className={CAMPO}
        />
      </label>
      <label className="block space-y-1">
        <span className={ETIQUETA}>Contacto (opcional)</span>
        <input
          name="contacto"
          defaultValue={consultorio?.contacto ?? ''}
          placeholder="Teléfono, correo…"
          className={CAMPO}
        />
      </label>
      <label className="block space-y-1">
        <span className={ETIQUETA}>Notas (opcional)</span>
        <textarea
          name="notas"
          rows={3}
          defaultValue={consultorio?.notas ?? ''}
          className={`${CAMPO} h-auto py-2`}
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
