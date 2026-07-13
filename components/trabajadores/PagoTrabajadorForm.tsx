'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  crearPagoTrabajadorAction,
  type FormState,
} from '@/app/(app)/configuracion/trabajadores/actions'
import type { MontoEstandarItem } from '@/lib/trabajadores/types'

const initial: FormState = { error: '' }
const inputClass =
  'h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'

function hoyLocal(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function PagoTrabajadorForm({
  trabajadorId,
  montos,
}: {
  trabajadorId: string
  montos: MontoEstandarItem[]
}) {
  const [state, formAction, pending] = useActionState(crearPagoTrabajadorAction, initial)
  const [monto, setMonto] = useState('')
  const [preset, setPreset] = useState('')
  const [fecha, setFecha] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const prev = useRef(state)

  useEffect(() => {
    if (!fecha) setFecha(hoyLocal())
  }, [fecha])
  useEffect(() => {
    if (state !== prev.current && !state.error) {
      formRef.current?.reset()
      setMonto('')
      setPreset('')
      setFecha(hoyLocal())
    }
    prev.current = state
  }, [state])

  function onPreset(id: string) {
    setPreset(id)
    const m = montos.find((x) => x.catalogo_trabajo_id === id)
    if (m) setMonto(String(m.monto))
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="trabajador_id" value={trabajadorId} />
      {montos.length > 0 ? (
        <label className="block space-y-1">
          <span className="text-sm text-[var(--color-muted)]">
            Usar monto estándar (opcional)
          </span>
          <select
            name="catalogo_trabajo_id"
            value={preset}
            onChange={(e) => onPreset(e.target.value)}
            className={`${inputClass} w-full`}
          >
            <option value="">— Ninguno —</option>
            {montos.map((m) => (
              <option key={m.id} value={m.catalogo_trabajo_id}>
                {m.tipo_nombre} — S/ {m.monto}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <input
          name="monto"
          type="number"
          min="0"
          step="0.01"
          required
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Monto (S/)"
          className={inputClass}
        />
        <input
          name="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={inputClass}
        />
      </div>
      <input name="nota" placeholder="Nota (opcional)" className={`${inputClass} w-full`} />
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Registrando…' : 'Registrar pago'}
      </Button>
    </form>
  )
}
