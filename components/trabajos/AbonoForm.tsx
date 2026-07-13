'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { crearAbonoAction, type FormState } from '@/app/(app)/trabajos/actions'
import { METODOS_PAGO } from '@/lib/abonos/types'

const initial: FormState = { error: '' }
const inputClass =
  'h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'

/** Fecha de hoy en formato YYYY-MM-DD según la zona horaria local (evita el corrimiento por UTC). */
function hoyLocal(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

export function AbonoForm({ trabajoId }: { trabajoId: string }) {
  const [state, formAction, pending] = useActionState(crearAbonoAction, initial)
  const formRef = useRef<HTMLFormElement>(null)
  const prev = useRef(state)
  // Fecha controlada, inicializada tras el montaje (evita desajuste de hidratación).
  const [fecha, setFecha] = useState('')
  useEffect(() => {
    if (!fecha) setFecha(hoyLocal())
  }, [fecha])
  useEffect(() => {
    if (state !== prev.current && !state.error) {
      formRef.current?.reset()
      setFecha(hoyLocal())
    }
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
        <input
          name="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={inputClass}
        />
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
