'use client'

import { useState } from 'react'
import { ATAJOS_DE_PLAZO, fechaSugerida } from '@/lib/trabajos/plazo'
import { ponerFechaEntregaAction } from '@/app/(app)/trabajos/actions'

/**
 * Poner, cambiar o quitar la fecha prometida de entrega desde la ficha.
 *
 * Existe para los trabajos que **ya están en curso**. Entrar al formulario
 * completo solo para poner una fecha es fricción suficiente como para que no se
 * haga, y eso es exactamente lo que pasó: 46 de 47 trabajos sin fecha.
 *
 * Los atajos cuentan desde el ingreso del trabajo, no desde hoy: en un trabajo
 * que entró el lunes, «3 días» sigue siendo el jueves, que es la fecha que se le
 * prometió al consultorio.
 */
export function FechaEntregaEditable({
  trabajoId,
  fechaIngreso,
  fechaEntrega,
}: {
  trabajoId: string
  fechaIngreso: string
  fechaEntrega: string | null
}) {
  const [abierto, setAbierto] = useState(false)
  const [fecha, setFecha] = useState(fechaEntrega ?? '')

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-[13px] font-semibold text-[var(--color-accent)]"
      >
        {fechaEntrega ? 'Cambiar fecha de entrega' : 'Poner fecha de entrega'}
      </button>
    )
  }

  return (
    <form
      action={ponerFechaEntregaAction}
      className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
    >
      <input type="hidden" name="id" value={trabajoId} />

      <label className="block space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          Fecha de entrega
        </span>
        <input
          name="fecha_entrega"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
        />
      </label>

      <div className="flex flex-wrap gap-1.5">
        {ATAJOS_DE_PLAZO.map((a) => (
          <button
            key={a.etiqueta}
            type="button"
            onClick={() => setFecha(fechaSugerida(fechaIngreso, a.dias) ?? '')}
            className="h-9 rounded-full border border-[var(--color-border)] px-3 text-[13px] font-semibold transition-colors active:border-[var(--color-accent)]"
          >
            {a.etiqueta}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-2">
        <button
          type="submit"
          className="h-11 flex-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
        >
          Guardar
        </button>
        {/*
          Quitar manda su propio campo en vez de vaciar el input antes de
          enviar. Escribir el estado en el `onClick` y confiar en que React
          repinte el input antes de que el formulario se serialice es una
          carrera: se enviaría la fecha vieja y el botón no haría nada.
        */}
        {fecha ? (
          <button
            type="submit"
            name="quitar"
            value="1"
            className="h-11 rounded-[var(--radius-md)] px-3 text-[13px] font-semibold text-[var(--color-danger)]"
          >
            Quitar
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setFecha(fechaEntrega ?? '')
            setAbierto(false)
          }}
          className="h-11 px-3 text-[13px] font-semibold text-[var(--color-muted)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
