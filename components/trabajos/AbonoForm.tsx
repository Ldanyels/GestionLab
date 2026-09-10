'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CAMPO_COMPACTO } from '@/components/ui/campos'
import { crearAbonoAction, type FormState } from '@/app/(app)/trabajos/actions'
import { METODOS_PAGO } from '@/lib/abonos/types'
import { atajosDeMonto } from '@/lib/abonos/atajos'
import { formatMoney } from '@/lib/format'
import { useConexion } from '@/components/conexion/useConexion'

const initial: FormState = { error: '' }

/** Fecha de hoy en formato YYYY-MM-DD según la zona horaria local (evita el corrimiento por UTC). */
function hoyLocal(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

export function AbonoForm({
  trabajoId,
  saldo,
}: {
  trabajoId: string
  /** Lo que falta cobrar. De aquí salen los atajos de monto. */
  saldo: number
}) {
  const [state, formAction, pending] = useActionState(crearAbonoAction, initial)
  // Sin conexión no se envía: un abono que parece registrado y no lo está es
  // peor que uno sin registrar, porque nadie vuelve a mirarlo.
  const enLinea = useConexion()
  const formRef = useRef<HTMLFormElement>(null)
  const prev = useRef(state)
  // Fecha controlada, inicializada tras el montaje (evita desajuste de hidratación).
  const [fecha, setFecha] = useState('')
  /*
    El monto pasa a estado controlado para que los atajos puedan llenarlo.

    Con un input suelto habría que escribirle el valor por referencia al DOM y
    React lo pisaría en el siguiente repintado.
  */
  const [monto, setMonto] = useState('')
  const atajos = atajosDeMonto(saldo)
  useEffect(() => {
    if (!fecha) setFecha(hoyLocal())
  }, [fecha])
  useEffect(() => {
    if (state !== prev.current && !state.error) {
      formRef.current?.reset()
      setFecha(hoyLocal())
      // `reset()` no alcanza a un campo controlado: su valor lo manda React.
      setMonto('')
    }
    prev.current = state
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="trabajo_id" value={trabajoId} />

      {/*
        Los atajos van **antes** que los campos: el caso frecuente es cobrar
        todo lo que falta, y así ese caso se resuelve sin teclear nada. Llenan
        el monto en vez de enviar solos, para que se pueda ajustar antes de
        confirmar: un pago es dinero, y no debe salir de un solo toque
        irreversible.
      */}
      {atajos.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {atajos.map((a) => (
            <button
              key={a.etiqueta}
              type="button"
              onClick={() => setMonto(String(a.monto))}
              className="h-9 rounded-full border border-[var(--color-border)] px-3 text-[13px] font-semibold transition-colors active:border-[var(--color-accent)]"
            >
              {a.etiqueta} · {formatMoney(a.monto)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <input
          name="monto"
          type="number"
          min="0"
          step="0.01"
          required
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Monto (S/)"
          className={CAMPO_COMPACTO}
        />
        <select name="metodo" defaultValue="efectivo" className={CAMPO_COMPACTO}>
          {METODOS_PAGO.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          name="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={CAMPO_COMPACTO}
        />
        <input name="nota" placeholder="Nota (opcional)" className={CAMPO_COMPACTO} />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending || !enLinea}>
        {!enLinea ? 'Sin conexión' : pending ? 'Registrando…' : 'Registrar abono'}
      </Button>
    </form>
  )
}
