'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CAMPO_COMPACTO } from '@/components/ui/campos'
import { editarAbonoAction, type FormState } from '@/app/(app)/trabajos/actions'
import { METODOS_PAGO } from '@/lib/abonos/types'
import { formatMoney } from '@/lib/format'
import type { Abono } from '@/lib/abonos/types'

const initial: FormState = { error: '' }

/**
 * Un abono de la lista, con su corrección desplegable.
 *
 * El formulario nace cerrado: la mayoría de las veces solo se está mirando el
 * pago, y tres campos abiertos por abono convertirían la lista en un muro de
 * casillas. Se abre al tocar «Corregir».
 *
 * Al guardar se cierra solo. Dejarlo abierto haría dudar de si el cambio se
 * aplicó, que es justo la duda que trae a alguien a esta pantalla.
 */
export function AbonoEditable({
  abono,
  trabajoId,
  puedeEditar,
}: {
  abono: Abono
  trabajoId: string
  /** El técnico sin permiso de abonos no corrige: solo mira. */
  puedeEditar: boolean
}) {
  const [state, formAction, pending] = useActionState(editarAbonoAction, initial)
  const [abierto, setAbierto] = useState(false)
  const previo = useRef(state)

  useEffect(() => {
    if (state !== previo.current && !state.error) setAbierto(false)
    previo.current = state
  }, [state])

  return (
    <div className="px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="num block font-semibold text-[var(--color-success)]">
            {formatMoney(abono.monto)}
          </span>
          <span className="block truncate text-xs text-[var(--color-muted)]">
            {abono.fecha} · {abono.metodo}
            {abono.nota ? ` · ${abono.nota}` : ''}
          </span>
        </span>

        {puedeEditar ? (
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            className="shrink-0 text-[13px] font-semibold text-[var(--color-accent)]"
          >
            {abierto ? 'Cancelar' : 'Corregir'}
          </button>
        ) : null}
      </div>

      {abierto ? (
        <form action={formAction} className="mt-2.5 space-y-2">
          <input type="hidden" name="id" value={abono.id} />
          <input type="hidden" name="trabajo_id" value={trabajoId} />

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="sr-only">Monto</span>
              <input
                name="monto"
                type="number"
                min="0"
                step="0.01"
                defaultValue={abono.monto}
                required
                aria-label="Monto"
                className={CAMPO_COMPACTO}
              />
            </label>
            <label className="block">
              <span className="sr-only">Método</span>
              <select
                name="metodo"
                defaultValue={abono.metodo}
                aria-label="Método"
                className={CAMPO_COMPACTO}
              >
                {METODOS_PAGO.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Fecha</span>
              <input
                name="fecha"
                type="date"
                defaultValue={abono.fecha}
                aria-label="Fecha"
                className={CAMPO_COMPACTO}
              />
            </label>
            <label className="block">
              <span className="sr-only">Nota</span>
              <input
                name="nota"
                defaultValue={abono.nota ?? ''}
                placeholder="Nota (opcional)"
                aria-label="Nota"
                className={CAMPO_COMPACTO}
              />
            </label>
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {state.error}
            </p>
          ) : null}

          {/*
            Se avisa de que queda registrado. No es una amenaza: es lo que hace
            aceptable que un abono se pueda editar, y quien corrige de buena fe
            no tiene nada que temer de saberlo.
          */}
          <p className="text-[12px] text-[var(--color-muted)]">
            El monto anterior queda en el historial de actividad.
          </p>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar corrección'}
          </Button>
        </form>
      ) : null}
    </div>
  )
}
