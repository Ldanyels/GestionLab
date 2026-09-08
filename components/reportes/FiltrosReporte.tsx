'use client'

import { useState } from 'react'
import type { ConsultorioOpcion, DoctorOpcion } from '@/lib/reportes/opciones'

const campo =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'
const labelText = 'text-xs text-[var(--color-muted)]'

interface Props {
  desde: string
  hasta: string
  consultorioId?: string
  doctorId?: string
  consultorios: ConsultorioOpcion[]
  doctores: DoctorOpcion[]
}

/** Filtros del reporte: rango de fechas + consultorio y doctor encadenados. */
export function FiltrosReporte({
  desde,
  hasta,
  consultorioId,
  doctorId,
  consultorios,
  doctores,
}: Props) {
  const [consultorio, setConsultorio] = useState(consultorioId ?? '')
  const doctoresVisibles = consultorio
    ? doctores.filter((d) => d.consultorio_id === consultorio)
    : doctores

  return (
    <form className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className={labelText}>Desde</span>
          <input type="date" name="desde" defaultValue={desde} className={campo} />
        </label>
        <label className="space-y-1">
          <span className={labelText}>Hasta</span>
          <input type="date" name="hasta" defaultValue={hasta} className={campo} />
        </label>
      </div>

      <label className="block space-y-1">
        <span className={labelText}>Consultorio</span>
        <select
          name="consultorio"
          value={consultorio}
          onChange={(e) => setConsultorio(e.target.value)}
          className={campo}
        >
          <option value="">Todos los consultorios</option>
          {consultorios.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className={labelText}>Doctor</span>
        <select
          name="doctor"
          defaultValue={doctorId ?? ''}
          key={consultorio}
          className={campo}
        >
          <option value="">Todos los doctores</option>
          {doctoresVisibles.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="h-11 w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-medium text-[var(--color-accent-contrast)]"
      >
        Ver reporte
      </button>
    </form>
  )
}
