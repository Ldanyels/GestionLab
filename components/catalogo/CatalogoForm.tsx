'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import type { FormState } from '@/app/(app)/configuracion/catalogo/actions'
import type { CatalogoTrabajo } from '@/lib/catalogo/types'

const initial: FormState = { error: '' }
const inputClass =
  'w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'
const labelClass = 'block space-y-1'
const labelText = 'text-sm text-[var(--color-muted)]'

interface Props {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  item?: CatalogoTrabajo
  categorias: string[]
  submitLabel: string
}

export function CatalogoForm({ action, item, categorias, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initial)

  return (
    <form action={formAction} className="space-y-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <label className={labelClass}>
        <span className={labelText}>Categoría</span>
        <input
          name="categoria"
          required
          list="categorias"
          defaultValue={item?.categoria ?? ''}
          placeholder="Ej. Prótesis Fija"
          className={inputClass}
        />
        <datalist id="categorias">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>

      <label className={labelClass}>
        <span className={labelText}>Nombre del trabajo</span>
        <input
          name="nombre"
          required
          defaultValue={item?.nombre ?? ''}
          placeholder="Ej. Corona porcelana sobre metal"
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        <span className={labelText}>Precio base (S/)</span>
        <input
          name="precio_base"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          defaultValue={item?.precio_base ?? ''}
          className={inputClass}
        />
      </label>

      <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
        <legend className="px-1 text-sm text-[var(--color-muted)]">
          Componente variable (opcional)
        </legend>
        <p className="text-xs text-[var(--color-muted)]">
          Para precios como “120 + 20 × cofia”. Deja ambos vacíos si no aplica.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            name="variable_etiqueta"
            defaultValue={item?.variable_etiqueta ?? ''}
            placeholder="Etiqueta (ej. cofia)"
            className={inputClass}
          />
          <input
            name="variable_precio_unitario"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={item?.variable_precio_unitario ?? ''}
            placeholder="Precio unitario (S/)"
            className={inputClass}
          />
        </div>
      </fieldset>

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
