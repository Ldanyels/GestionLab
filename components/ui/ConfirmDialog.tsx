'use client'

import { useState } from 'react'
import { Sheet } from './Sheet'

interface Props {
  /** Server Action a ejecutar al confirmar. */
  action: (formData: FormData) => void | Promise<void>
  /** Campos ocultos que recibe la acción (ej. id). */
  fields: Record<string, string>
  triggerLabel: string
  triggerClassName?: string
  title: string
  message: string
  confirmLabel?: string
}

export function ConfirmDialog({
  action,
  fields,
  triggerLabel,
  triggerClassName = '',
  title,
  message,
  confirmLabel = 'Eliminar',
}: Props) {
  const [abierta, setAbierta] = useState(false)

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setAbierta(true)}>
        {triggerLabel}
      </button>

      <Sheet
        abierta={abierta}
        onCerrar={() => setAbierta(false)}
        titulo={title}
        anchoMax={420}
      >
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">{message}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setAbierta(false)}
            className="h-11 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-medium"
          >
            Cancelar
          </button>
          <form action={action} className="flex-1">
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <button
              type="submit"
              className="h-11 w-full rounded-[var(--radius-md)] bg-[var(--color-danger)] text-sm font-medium text-white"
            >
              {confirmLabel}
            </button>
          </form>
        </div>
      </Sheet>
    </>
  )
}
