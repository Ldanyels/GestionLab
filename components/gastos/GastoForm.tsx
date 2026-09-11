'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CAMPO_COMPACTO } from '@/components/ui/campos'
import { useConexion } from '@/components/conexion/useConexion'
import {
  AYUDA_CATEGORIA,
  CATEGORIAS_GASTO,
  CONCEPTOS_FRECUENTES,
  ETIQUETA_CATEGORIA,
  type CategoriaGasto,
} from '@/lib/gastos/categorias'
import type { FormState } from '@/app/(app)/finanzas/gastos/actions'

const initial: FormState = { error: '' }

/**
 * Registrar un gasto.
 *
 * La categoría se elige con tres botones y no con un desplegable: son tres
 * opciones, y un desplegable de tres esconde dos de ellas detrás de un toque
 * extra.
 *
 * Los conceptos frecuentes están porque la luz y el agua se registran doce
 * veces al año cada una. Teclearlas doce veces es exactamente la fricción que
 * hace que el gasto no se registre, y un gasto sin registrar es una utilidad
 * inflada.
 */
export function GastoForm({
  hoy,
  action,
}: {
  hoy: string
  action: (prev: FormState, formData: FormData) => Promise<FormState>
}) {
  const [state, formAction, pending] = useActionState(action, initial)
  const enLinea = useConexion()

  const [categoria, setCategoria] = useState<CategoriaGasto>('servicio')
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoy)

  /*
    Tras guardar se limpian el concepto y el monto, pero **no** la categoría ni
    la fecha: los recibos se registran en tanda —luz, agua, internet del mismo
    mes— y volver a elegir «Servicios» y la fecha en cada uno es la fricción que
    hace que se registre el primero y no los otros dos.
  */
  const anterior = useRef(state)
  useEffect(() => {
    if (state !== anterior.current && !state.error) {
      setConcepto('')
      setMonto('')
    }
    anterior.current = state
  }, [state])

  const frecuentes = CONCEPTOS_FRECUENTES[categoria]

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="categoria" value={categoria} />

      <div className="space-y-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          {CATEGORIAS_GASTO.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              aria-pressed={categoria === c}
              className={`h-11 rounded-[var(--radius-md)] border text-[13.5px] font-semibold transition-colors ${
                categoria === c
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)]'
              }`}
            >
              {ETIQUETA_CATEGORIA[c]}
            </button>
          ))}
        </div>
        <p className="text-[12.5px] text-[var(--color-muted)]">{AYUDA_CATEGORIA[categoria]}</p>
      </div>

      <label className="block space-y-1">
        <span className="text-[12.5px] text-[var(--color-muted)]">¿En qué fue?</span>
        <input
          name="concepto"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          maxLength={120}
          required
          placeholder="Luz — recibo de agosto"
          className={CAMPO_COMPACTO}
        />
      </label>

      {/*
        Los atajos llenan el campo y se pueden seguir editando: «Luz» queda
        escrito y encima se le añade «— recibo de agosto» si hace falta. Una
        lista cerrada de conceptos obligaría a mantenerla cada vez que aparece
        un gasto nuevo.
      */}
      {frecuentes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {frecuentes.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setConcepto(c)}
              className="h-9 rounded-full border border-[var(--color-border)] px-3 text-[13px] font-semibold transition-colors active:border-[var(--color-accent)]"
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[12.5px] text-[var(--color-muted)]">Monto (S/)</span>
          <input
            name="monto"
            type="number"
            min="0"
            step="0.01"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className={CAMPO_COMPACTO}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[12.5px] text-[var(--color-muted)]">Fecha</span>
          <input
            name="fecha"
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={CAMPO_COMPACTO}
          />
        </label>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending || !enLinea}>
        {!enLinea ? 'Sin conexión' : pending ? 'Guardando…' : 'Registrar gasto'}
      </Button>
    </form>
  )
}
