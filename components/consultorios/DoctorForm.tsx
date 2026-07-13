'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { crearDoctorAction } from '@/app/(app)/consultorios/actions'
import type { FormState } from '@/app/(app)/consultorios/actions'

const initial: FormState = { error: '' }
const inputClass =
  'w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'

export function DoctorForm({ consultorioId }: { consultorioId: string }) {
  const [state, formAction, pending] = useActionState(crearDoctorAction, initial)
  const formRef = useRef<HTMLFormElement>(null)
  const prev = useRef(state)

  // Al completar con éxito (nuevo estado sin error), limpiar el formulario.
  useEffect(() => {
    if (state !== prev.current && !state.error) formRef.current?.reset()
    prev.current = state
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="consultorio_id" value={consultorioId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="nombre"
          required
          placeholder="Nombre del doctor"
          className={inputClass}
        />
        <input name="contacto" placeholder="Contacto (opcional)" className={inputClass} />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? 'Agregando…' : 'Agregar doctor'}
      </Button>
    </form>
  )
}
