'use client'

import { useState } from 'react'

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
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-[var(--color-muted)]">{message}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
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
          </div>
        </div>
      ) : null}
    </>
  )
}
