'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  agregarRecetaAction,
  editarRecetaAction,
  eliminarRecetaAction,
  type FormState,
} from '@/app/(app)/configuracion/catalogo/actions'
import type { RecetaItem } from '@/lib/recetas/data'

const initial: FormState = { error: '' }
const inputClass =
  'h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'

interface Producto {
  id: string
  nombre: string
  unidad: string
}

function RecetaFila({ item, catalogoId }: { item: RecetaItem; catalogoId: string }) {
  const [state, formAction, pending] = useActionState(editarRecetaAction, initial)
  return (
    <li className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <span className="min-w-0 flex-1 truncate text-sm">{item.producto_nombre}</span>
      <form action={formAction} className="flex items-center gap-1">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="catalogo_trabajo_id" value={catalogoId} />
        <input
          name="cantidad"
          type="number"
          min="0"
          step="0.001"
          defaultValue={item.cantidad}
          className={`${inputClass} w-24`}
        />
        <span className="text-xs text-[var(--color-muted)]">{item.unidad}</span>
        <button
          type="submit"
          disabled={pending}
          className="px-2 text-sm text-[var(--color-accent)]"
        >
          {pending ? '…' : 'Guardar'}
        </button>
      </form>
      <ConfirmDialog
        action={eliminarRecetaAction}
        fields={{ id: item.id, catalogo_trabajo_id: catalogoId }}
        triggerLabel="✕"
        triggerClassName="shrink-0 px-2 text-[var(--color-danger)]"
        title="Quitar insumo"
        message={`¿Quitar "${item.producto_nombre}" de la receta?`}
        confirmLabel="Quitar"
      />
    </li>
  )
}

function AgregarInsumo({
  catalogoId,
  productos,
}: {
  catalogoId: string
  productos: Producto[]
}) {
  const [state, formAction, pending] = useActionState(agregarRecetaAction, initial)
  const formRef = useRef<HTMLFormElement>(null)
  const prev = useRef(state)
  useEffect(() => {
    if (state !== prev.current && !state.error) formRef.current?.reset()
    prev.current = state
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="catalogo_trabajo_id" value={catalogoId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <select name="producto_id" required defaultValue="" className={`${inputClass} flex-1`}>
          <option value="" disabled>
            Insumo…
          </option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} ({p.unidad})
            </option>
          ))}
        </select>
        <input
          name="cantidad"
          type="number"
          min="0"
          step="0.001"
          required
          placeholder="Cantidad"
          className={`${inputClass} sm:w-32`}
        />
        <Button type="submit" className="sm:w-auto" disabled={pending}>
          Agregar
        </Button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}

export function RecetaEditor({
  catalogoId,
  receta,
  productos,
}: {
  catalogoId: string
  receta: RecetaItem[]
  productos: Producto[]
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Receta (insumos)</h2>
      <p className="text-sm text-[var(--color-muted)]">
        Insumos y cantidades estándar que consume este trabajo. Se descuentan del stock
        automáticamente al cerrar el trabajo.
      </p>
      {productos.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          Primero crea insumos en Inventario.
        </p>
      ) : (
        <>
          {receta.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Sin insumos aún.</p>
          ) : (
            <ul className="space-y-2">
              {receta.map((r) => (
                <RecetaFila key={r.id} item={r} catalogoId={catalogoId} />
              ))}
            </ul>
          )}
          <AgregarInsumo catalogoId={catalogoId} productos={productos} />
        </>
      )}
    </div>
  )
}
