'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { CAMPO, ETIQUETA } from '@/components/ui/campos'
import type { FormState } from '@/app/(app)/configuracion/catalogo/actions'
import type { CatalogoTrabajo } from '@/lib/catalogo/types'

const initial: FormState = { error: '' }
const labelClass = 'block space-y-1'

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
        <span className={ETIQUETA}>Categoría</span>
        <input
          name="categoria"
          required
          list="categorias"
          defaultValue={item?.categoria ?? ''}
          placeholder="Ej. Prótesis Fija"
          className={CAMPO}
        />
        <datalist id="categorias">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>

      <label className={labelClass}>
        <span className={ETIQUETA}>Nombre del trabajo</span>
        <input
          name="nombre"
          required
          defaultValue={item?.nombre ?? ''}
          placeholder="Ej. Corona porcelana sobre metal"
          className={CAMPO}
        />
      </label>

      <label className={labelClass}>
        <span className={ETIQUETA}>Precio base (S/)</span>
        <input
          name="precio_base"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          defaultValue={item?.precio_base ?? ''}
          className={CAMPO}
        />
      </label>

      {/*
        El plazo va junto al precio porque son las dos cosas que se prometen al
        consultorio: cuánto cuesta y para cuándo está. Con el plazo aquí, la
        fecha de entrega de cada trabajo se calcula sola en el alta.
      */}
      <label className={labelClass}>
        <span className={ETIQUETA}>Días de entrega (opcional)</span>
        <input
          name="dias_entrega"
          type="number"
          inputMode="numeric"
          step="1"
          min="0"
          max="365"
          placeholder="Ej. 3"
          defaultValue={item?.dias_entrega ?? ''}
          className={CAMPO}
        />
        <span className="text-xs text-[var(--color-muted)]">
          Cuántos días desde que entra hasta que se entrega. Si lo dejas vacío, los
          trabajos de este tipo nacen sin fecha y se les puede poner a mano.
        </span>
      </label>

      <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
        <legend className={`px-1 ${ETIQUETA}`}>
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
            className={CAMPO}
          />
          <input
            name="variable_precio_unitario"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={item?.variable_precio_unitario ?? ''}
            placeholder="Precio unitario (S/)"
            className={CAMPO}
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
