'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  guardarMontoEstandarAction,
  eliminarMontoEstandarAction,
  type FormState,
} from '@/app/(app)/configuracion/trabajadores/actions'
import { formatMoney } from '@/lib/format'
import type { MontoEstandarItem } from '@/lib/trabajadores/types'

const initial: FormState = { error: '' }
const inputClass =
  'h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'

interface Tipo {
  id: string
  nombre: string
}

export function MontoEstandarEditor({
  trabajadorId,
  montos,
  tipos,
}: {
  trabajadorId: string
  montos: MontoEstandarItem[]
  tipos: Tipo[]
}) {
  const [state, formAction, pending] = useActionState(guardarMontoEstandarAction, initial)
  const formRef = useRef<HTMLFormElement>(null)
  const prev = useRef(state)
  useEffect(() => {
    if (state !== prev.current && !state.error) formRef.current?.reset()
    prev.current = state
  }, [state])

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Montos estándar</h2>
      <p className="text-sm text-[var(--color-muted)]">
        Monto que se le paga por tipo de trabajo. Podrás seleccionarlo al registrar un pago.
      </p>
      {montos.length > 0 ? (
        <ul className="space-y-2">
          {montos.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
            >
              <span className="min-w-0 truncate">{m.tipo_nombre}</span>
              <span className="flex items-center gap-3">
                <span className="font-medium tabular-nums">{formatMoney(m.monto)}</span>
                <ConfirmDialog
                  action={eliminarMontoEstandarAction}
                  fields={{ id: m.id, trabajador_id: trabajadorId }}
                  triggerLabel="✕"
                  triggerClassName="text-[var(--color-danger)]"
                  title="Quitar monto estándar"
                  message={`¿Quitar el monto estándar de "${m.tipo_nombre}"?`}
                  confirmLabel="Quitar"
                />
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {tipos.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          Primero crea tipos de trabajo en el catálogo.
        </p>
      ) : (
        <form ref={formRef} action={formAction} className="space-y-2">
          <input type="hidden" name="trabajador_id" value={trabajadorId} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              name="catalogo_trabajo_id"
              required
              defaultValue=""
              className={`${inputClass} flex-1`}
            >
              <option value="" disabled>
                Tipo de trabajo…
              </option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            <input
              name="monto"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="Monto (S/)"
              className={`${inputClass} sm:w-32`}
            />
            <Button type="submit" className="sm:w-auto" disabled={pending}>
              Guardar
            </Button>
          </div>
          {state.error ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {state.error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  )
}
