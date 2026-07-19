'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  editarDoctorAction,
  eliminarDoctorAction,
  archivarDoctorAction,
  type FormState,
} from '@/app/(app)/consultorios/actions'
import type { Doctor } from '@/lib/consultorios/types'

const initial: FormState = { error: '' }
const inputClass =
  'w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'

export function DoctorRow({ doctor }: { doctor: Doctor }) {
  const [editing, setEditing] = useState(false)
  const [state, formAction, pending] = useActionState(editarDoctorAction, initial)
  const prev = useRef(state)

  useEffect(() => {
    if (state !== prev.current && !state.error) setEditing(false)
    prev.current = state
  }, [state])

  if (editing) {
    return (
      <li className="rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-surface)] p-3">
        <form action={formAction} className="space-y-2">
          <input type="hidden" name="id" value={doctor.id} />
          <input type="hidden" name="consultorio_id" value={doctor.consultorio_id} />
          <input
            name="nombre"
            required
            defaultValue={doctor.nombre}
            className={inputClass}
          />
          <input
            name="contacto"
            defaultValue={doctor.contacto ?? ''}
            placeholder="Contacto (opcional)"
            className={inputClass}
          />
          {state.error ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {state.error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-10 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm"
            >
              Cancelar
            </button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <span className="min-w-0">
        <span className="block truncate font-medium">
          {doctor.nombre}
          {!doctor.activo ? (
            <span className="ml-2 rounded-full bg-[var(--color-muted)]/15 px-2 py-0.5 text-xs font-normal text-[var(--color-muted)]">
              Archivado
            </span>
          ) : null}
        </span>
        {doctor.contacto ? (
          <span className="block truncate text-sm text-[var(--color-muted)]">
            {doctor.contacto}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-3 pl-2 text-sm">
        {doctor.activo ? (
          <>
            <Link
              href={`/trabajos/nuevo?doctor=${doctor.id}`}
              className="font-medium text-[var(--color-accent)]"
            >
              + Trabajo
            </Link>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-[var(--color-accent)]"
            >
              Editar
            </button>
          </>
        ) : null}
        <form action={archivarDoctorAction}>
          <input type="hidden" name="id" value={doctor.id} />
          <input type="hidden" name="consultorio_id" value={doctor.consultorio_id} />
          <input type="hidden" name="activo" value={doctor.activo ? 'false' : 'true'} />
          <button type="submit" className="text-[var(--color-muted)]">
            {doctor.activo ? 'Archivar' : 'Reactivar'}
          </button>
        </form>
        <ConfirmDialog
          action={eliminarDoctorAction}
          fields={{ id: doctor.id, consultorio_id: doctor.consultorio_id }}
          triggerLabel="Eliminar"
          triggerClassName="text-[var(--color-danger)]"
          title="Eliminar definitivo"
          message={`Esto borra a ${doctor.nombre} y TODOS sus trabajos y pagos. No se puede deshacer. ¿Prefieres archivar? Si estás seguro, confirma.`}
          confirmLabel="Sí, eliminar todo"
        />
      </span>
    </li>
  )
}
