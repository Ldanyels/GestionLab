'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { registrarMovimientoAction, type FormState } from '@/app/(app)/inventario/actions'

const initial: FormState = { error: '' }
const inputClass =
  'h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'

function hoyLocal(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function MovimientoForm({ productoId }: { productoId: string }) {
  const [state, formAction, pending] = useActionState(registrarMovimientoAction, initial)
  const [tipo, setTipo] = useState('ingreso')
  const [origen, setOrigen] = useState('compra')
  const [fecha, setFecha] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const prev = useRef(state)

  useEffect(() => {
    if (!fecha) setFecha(hoyLocal())
  }, [fecha])
  useEffect(() => {
    if (state !== prev.current && !state.error) {
      formRef.current?.reset()
      setTipo('ingreso')
      setOrigen('compra')
      setFecha(hoyLocal())
    }
    prev.current = state
  }, [state])

  const mostrarCosto = tipo === 'ingreso' && (origen === 'compra' || origen === 'otro')

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="producto_id" value={productoId} />
      <div className="grid grid-cols-2 gap-2">
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className={inputClass}
        >
          <option value="ingreso">Ingreso (+)</option>
          <option value="salida">Salida (−)</option>
          <option value="ajuste">Ajuste</option>
          <option value="merma">Merma (−)</option>
        </select>
        <input
          name="cantidad"
          type="number"
          min="0"
          step="0.001"
          required
          placeholder="Cantidad"
          className={inputClass}
        />
        <input
          name="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={inputClass}
        />
        <input name="motivo" placeholder="Motivo (opcional)" className={inputClass} />
      </div>

      {tipo === 'ingreso' ? (
        <div className="grid grid-cols-2 gap-2">
          <select
            name="origen"
            value={origen}
            onChange={(e) => setOrigen(e.target.value)}
            className={inputClass}
          >
            <option value="compra">Origen: Compra</option>
            <option value="ajuste">Origen: Ajuste de stock</option>
            <option value="otro">Origen: Otro</option>
          </select>
          {mostrarCosto ? (
            <input
              name="costo_unitario"
              type="number"
              min="0"
              step="0.01"
              placeholder="Costo unitario (S/)"
              className={inputClass}
            />
          ) : (
            <span />
          )}
        </div>
      ) : null}
      {mostrarCosto ? (
        <p className="text-xs text-[var(--color-muted)]">
          El costo unitario actualizará el precio del producto (útil si varía por
          proveedor/marca).
        </p>
      ) : null}

      {tipo === 'ajuste' ? (
        <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <input type="checkbox" name="ajuste_resta" />
          Restar del stock (en vez de sumar)
        </label>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Registrando…' : 'Registrar movimiento'}
      </Button>
    </form>
  )
}
