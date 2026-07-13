'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { UNIDADES } from '@/lib/inventario/types'
import type { FormState } from '@/app/(app)/inventario/actions'
import type { Producto } from '@/lib/inventario/types'

const initial: FormState = { error: '' }
const inputClass =
  'w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'
const labelText = 'text-sm text-[var(--color-muted)]'

interface Props {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  producto?: Producto
  submitLabel: string
}

export function ProductoForm({ action, producto, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initial)

  return (
    <form action={formAction} className="space-y-4">
      {producto ? <input type="hidden" name="id" value={producto.id} /> : null}

      <label className="block space-y-1">
        <span className={labelText}>Nombre del insumo</span>
        <input
          name="nombre"
          required
          defaultValue={producto?.nombre ?? ''}
          placeholder="Ej. Acrílico rosado"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className={labelText}>Unidad</span>
          <select
            name="unidad"
            defaultValue={producto?.unidad ?? 'unidad'}
            className={inputClass}
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className={labelText}>Stock mínimo</span>
          <input
            name="stock_minimo"
            type="number"
            min="0"
            step="0.001"
            defaultValue={producto?.stock_minimo ?? 0}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1">
          <span className={labelText}>Costo unitario (S/)</span>
          <input
            name="costo_unitario"
            type="number"
            min="0"
            step="0.01"
            defaultValue={producto?.costo_unitario ?? 0}
            className={inputClass}
          />
        </label>
        {!producto ? (
          <label className="block space-y-1">
            <span className={labelText}>Stock inicial</span>
            <input
              name="stock_inicial"
              type="number"
              min="0"
              step="0.001"
              defaultValue={0}
              className={inputClass}
            />
          </label>
        ) : null}
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}
