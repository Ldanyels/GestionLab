'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { CAMPO, ETIQUETA } from '@/components/ui/campos'
import { UNIDADES } from '@/lib/inventario/types'
import type { FormState } from '@/app/(app)/inventario/actions'
import type { Producto } from '@/lib/inventario/types'

const initial: FormState = { error: '' }

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
        <span className={ETIQUETA}>Nombre del insumo</span>
        <input
          name="nombre"
          required
          defaultValue={producto?.nombre ?? ''}
          placeholder="Ej. Acrílico rosado"
          className={CAMPO}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className={ETIQUETA}>Unidad</span>
          <select
            name="unidad"
            defaultValue={producto?.unidad ?? 'unidad'}
            className={CAMPO}
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className={ETIQUETA}>Stock mínimo</span>
          <input
            name="stock_minimo"
            type="number"
            min="0"
            step="0.001"
            defaultValue={producto?.stock_minimo ?? 0}
            className={CAMPO}
          />
        </label>
        <label className="block space-y-1">
          <span className={ETIQUETA}>Costo unitario (S/)</span>
          <input
            name="costo_unitario"
            type="number"
            min="0"
            step="0.01"
            defaultValue={producto?.costo_unitario ?? 0}
            className={CAMPO}
          />
        </label>
        {!producto ? (
          <label className="block space-y-1">
            <span className={ETIQUETA}>Stock inicial</span>
            <input
              name="stock_inicial"
              type="number"
              min="0"
              step="0.001"
              defaultValue={0}
              className={CAMPO}
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
