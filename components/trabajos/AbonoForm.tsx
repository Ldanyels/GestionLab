'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { crearAbonoAction, type FormState } from '@/app/(app)/trabajos/actions'
import { METODOS_PAGO } from '@/lib/abonos/types'

const initial: FormState = { error: '' }
const inputClass =
  'h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'

export function AbonoForm({ trabajoId }: { trabajoId: string }) {
  const [state, formAction, pending] = useActionState(crearAbonoAction, initial)
  const formRef = useRef<HTMLFormElement>(null)
  const prev = useRef(state)
  useEffect(() => {
    if (state !== prev.current && !state.error) formRef.current?.reset()
    prev.current = state
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="trabajo_id" value={trabajoId} />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="monto"
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="Monto (S/)"
          className={inputClass}
        />
        <select name="metodo" defaultValue="efectivo" className={inputClass}>
          {METODOS_PAGO.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input name="fecha" type="date" className={inputClass} />
        <input name="nota" placeholder="Nota (opcional)" className={inputClass} />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Registrando…' : 'Registrar abono'}
      </Button>
    </form>
  )
}
