'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  crearEtapaAction,
  editarEtapaAction,
  eliminarEtapaAction,
  moverEtapaAction,
  type FormState,
} from '@/app/(app)/configuracion/catalogo/actions'
import type { PlantillaEtapa } from '@/lib/catalogo/types'

const initial: FormState = { error: '' }
const inputClass =
  'w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'

function EtapaRow({
  etapa,
  prev,
  next,
}: {
  etapa: PlantillaEtapa
  prev?: PlantillaEtapa
  next?: PlantillaEtapa
}) {
  const [editing, setEditing] = useState(false)
  const [state, formAction, pending] = useActionState(editarEtapaAction, initial)
  const last = useRef(state)
  useEffect(() => {
    if (state !== last.current && !state.error) setEditing(false)
    last.current = state
  }, [state])

  if (editing) {
    return (
      <li className="rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-surface)] p-3">
        <form action={formAction} className="space-y-2">
          <input type="hidden" name="id" value={etapa.id} />
          <input type="hidden" name="catalogo_trabajo_id" value={etapa.catalogo_trabajo_id} />
          <input name="nombre" required defaultValue={etapa.nombre} className={inputClass} />
          {state.error ? (
            <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
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
    <li className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <span className="flex flex-col">
        <MoverBtn etapa={etapa} otra={prev} label="↑" disabled={!prev} />
        <MoverBtn etapa={etapa} otra={next} label="↓" disabled={!next} />
      </span>
      <span className="min-w-0 flex-1 truncate">{etapa.nombre}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm text-[var(--color-accent)]"
      >
        Editar
      </button>
      <ConfirmDialog
        action={eliminarEtapaAction}
        fields={{ id: etapa.id, catalogo_trabajo_id: etapa.catalogo_trabajo_id }}
        triggerLabel="Eliminar"
        triggerClassName="text-sm text-[var(--color-danger)]"
        title="Eliminar etapa"
        message={`¿Eliminar la etapa "${etapa.nombre}"?`}
      />
    </li>
  )
}

function MoverBtn({
  etapa,
  otra,
  label,
  disabled,
}: {
  etapa: PlantillaEtapa
  otra?: PlantillaEtapa
  label: string
  disabled: boolean
}) {
  if (disabled || !otra) {
    return (
      <span className="px-1 text-xs text-[var(--color-border)]" aria-hidden>
        {label}
      </span>
    )
  }
  return (
    <form action={moverEtapaAction}>
      <input type="hidden" name="catalogo_trabajo_id" value={etapa.catalogo_trabajo_id} />
      <input type="hidden" name="a_id" value={etapa.id} />
      <input type="hidden" name="a_orden" value={etapa.orden} />
      <input type="hidden" name="b_id" value={otra.id} />
      <input type="hidden" name="b_orden" value={otra.orden} />
      <button
        type="submit"
        aria-label={`Mover ${label === '↑' ? 'arriba' : 'abajo'}`}
        className="px-1 text-xs text-[var(--color-muted)]"
      >
        {label}
      </button>
    </form>
  )
}

function AgregarEtapa({ catalogoId }: { catalogoId: string }) {
  const [state, formAction, pending] = useActionState(crearEtapaAction, initial)
  const formRef = useRef<HTMLFormElement>(null)
  const last = useRef(state)
  useEffect(() => {
    if (state !== last.current && !state.error) formRef.current?.reset()
    last.current = state
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="catalogo_trabajo_id" value={catalogoId} />
      <input
        name="nombre"
        required
        placeholder="Nueva etapa (ej. Encerado)"
        className={inputClass}
      />
      <Button type="submit" className="sm:w-auto" disabled={pending}>
        {pending ? 'Agregando…' : 'Agregar etapa'}
      </Button>
    </form>
  )
}

export function EtapasEditor({
  catalogoId,
  etapas,
}: {
  catalogoId: string
  etapas: PlantillaEtapa[]
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Etapas</h2>
      <p className="text-sm text-[var(--color-muted)]">
        Etapas estándar de este trabajo. Al crear un trabajo se copiarán y podrás
        ajustarlas o excluir las que haga un proveedor externo.
      </p>
      {etapas.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Aún no hay etapas.</p>
      ) : (
        <ul className="space-y-2">
          {etapas.map((e, idx) => (
            <EtapaRow
              key={e.id}
              etapa={e}
              prev={etapas[idx - 1]}
              next={etapas[idx + 1]}
            />
          ))}
        </ul>
      )}
      <AgregarEtapa catalogoId={catalogoId} />
    </div>
  )
}
