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
  soloPendientes: boolean
  consultorios: ConsultorioOpcion[]
  doctores: DoctorOpcion[]
}

/** Filtros del reporte: qué mostrar, rango de fechas y consultorio/doctor. */
export function FiltrosReporte({
  desde,
  hasta,
  consultorioId,
  doctorId,
  soloPendientes,
  consultorios,
  doctores,
}: Props) {
  const [consultorio, setConsultorio] = useState(consultorioId ?? '')
  const [mostrar, setMostrar] = useState(soloPendientes ? 'pendientes' : 'todos')
  const doctoresVisibles = consultorio
    ? doctores.filter((d) => d.consultorio_id === consultorio)
    : doctores

  return (
    <form className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <fieldset className="space-y-1">
        <legend className={labelText}>Qué incluir</legend>
        <div className="grid grid-cols-2 gap-2">
          <OpcionMostrar
            valor="pendientes"
            etiqueta="Solo por cobrar"
            actual={mostrar}
            onSelect={setMostrar}
          />
          <OpcionMostrar
            valor="todos"
            etiqueta="Todos los trabajos"
            actual={mostrar}
            onSelect={setMostrar}
          />
        </div>
      </fieldset>

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

/** Opción de "qué incluir": radio nativo con apariencia de pastilla. */
function OpcionMostrar({
  valor,
  etiqueta,
  actual,
  onSelect,
}: {
  valor: string
  etiqueta: string
  actual: string
  onSelect: (v: string) => void
}) {
  const activo = actual === valor
  return (
    <label
      className={`flex h-11 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border px-2 text-center text-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-accent)] ${
        activo
          ? 'border-[var(--color-accent)] font-medium text-[var(--color-accent)]'
          : 'border-[var(--color-border)] text-[var(--color-muted)]'
      }`}
    >
      <input
        type="radio"
        name="mostrar"
        value={valor}
        checked={activo}
        onChange={() => onSelect(valor)}
        className="sr-only"
      />
      {etiqueta}
    </label>
  )
}
