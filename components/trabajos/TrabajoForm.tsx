'use client'

import { useActionState, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { formatMoney } from '@/lib/format'
import { precioEfectivo, precioTotalTrabajo } from '@/lib/catalogo/precio'
import { TipoCombobox } from './TipoCombobox'
import type { FormState } from '@/app/(app)/trabajos/actions'
import type { DoctorOpcion } from '@/lib/consultorios/data'
import type { CatalogoTrabajo } from '@/lib/catalogo/types'
import type { Trabajo } from '@/lib/trabajos/types'

const initial: FormState = { error: '' }
const inputClass =
  'w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'
const labelText = 'text-sm text-[var(--color-muted)]'
const stepperBtnClass =
  'h-11 w-12 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] text-xl leading-none active:border-[var(--color-accent)]'

interface Props {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  doctores: DoctorOpcion[]
  tipos: CatalogoTrabajo[]
  trabajo?: Trabajo
  doctorInicial?: string
  submitLabel: string
}

export function TrabajoForm({
  action,
  doctores,
  tipos,
  trabajo,
  doctorInicial,
  submitLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, initial)
  const [tipoId, setTipoId] = useState(trabajo?.catalogo_trabajo_id ?? '')
  const [tipoError, setTipoError] = useState('')
  const [piezas, setPiezas] = useState(trabajo?.cantidad ?? 1)
  const [varCantidad, setVarCantidad] = useState(trabajo?.variable_cantidad ?? 1)
  const [manual, setManual] = useState(false)

  const tipo = useMemo(() => tipos.find((t) => t.id === tipoId), [tipos, tipoId])
  const cantidadVariable = tipo?.variable_etiqueta ? varCantidad : 0
  const precioUnitario = tipo ? precioEfectivo(tipo, cantidadVariable) : 0
  const precioCalculado = tipo ? precioTotalTrabajo(tipo, piezas, cantidadVariable) : 0

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!tipoId) {
          e.preventDefault()
          setTipoError('Selecciona un tipo de trabajo')
        }
      }}
      className="space-y-4"
    >
      {trabajo ? <input type="hidden" name="id" value={trabajo.id} /> : null}

      <label className="block space-y-1">
        <span className={labelText}>Doctor</span>
        <select
          name="doctor_id"
          required
          defaultValue={trabajo?.doctor_id ?? doctorInicial ?? ''}
          className={inputClass}
        >
          <option value="" disabled>
            Selecciona un doctor…
          </option>
          {doctores.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre} — {d.consultorio_nombre}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-1">
        <span id="tipo-trabajo-label" className={labelText}>
          Tipo de trabajo
        </span>
        <TipoCombobox
          tipos={tipos}
          value={tipoId}
          onChange={(id) => {
            setTipoId(id)
            setTipoError('')
          }}
          disabled={!!trabajo}
          labelId="tipo-trabajo-label"
        />
        <input type="hidden" name="catalogo_trabajo_id" value={tipoId} />
        {tipoError ? (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {tipoError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <span className={labelText}>
          Cantidad (mismo trabajo para varios dientes)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Quitar una pieza"
            onClick={() => setPiezas((p) => Math.max(1, p - 1))}
            className={stepperBtnClass}
          >
            −
          </button>
          <input
            name="cantidad"
            type="number"
            min="1"
            step="1"
            value={piezas}
            onChange={(e) => setPiezas(Math.max(1, Number(e.target.value) || 1))}
            className={`${inputClass} text-center`}
          />
          <button
            type="button"
            aria-label="Agregar una pieza"
            onClick={() => setPiezas((p) => p + 1)}
            className={stepperBtnClass}
          >
            +
          </button>
        </div>
      </div>

      {tipo?.variable_etiqueta ? (
        <label className="block space-y-1">
          <span className={labelText}>
            Cantidad de {tipo.variable_etiqueta} por pieza (×{' '}
            {formatMoney(tipo.variable_precio_unitario ?? 0)})
          </span>
          <input
            name="variable_cantidad"
            type="number"
            min="0"
            step="1"
            value={varCantidad}
            onChange={(e) => setVarCantidad(Number(e.target.value))}
            className={inputClass}
          />
        </label>
      ) : (
        <input type="hidden" name="variable_cantidad" value={0} />
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className={labelText}>Paciente (opcional)</span>
          <input
            name="paciente_nombre"
            defaultValue={trabajo?.paciente_nombre ?? ''}
            placeholder="Nombre del paciente"
            className={inputClass}
          />
        </label>
        <label className="block space-y-1">
          <span className={labelText}>Pieza / diente (opcional)</span>
          <input
            name="pieza"
            defaultValue={trabajo?.pieza ?? ''}
            placeholder="Ej. 11, 21"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className={labelText}>Fecha de entrega (opcional)</span>
        <input
          name="fecha_entrega"
          type="date"
          defaultValue={trabajo?.fecha_entrega ?? ''}
          className={inputClass}
        />
      </label>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
        <div className="flex items-center justify-between">
          <span className={labelText}>Precio</span>
          <span className="text-right">
            {!manual && piezas > 1 ? (
              <span className="block text-xs text-[var(--color-muted)]">
                {piezas} × {formatMoney(precioUnitario)}
              </span>
            ) : null}
            <span className="text-lg font-semibold tabular-nums">
              {manual ? 'Manual' : formatMoney(precioCalculado)}
            </span>
          </span>
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={manual}
            onChange={(e) => setManual(e.target.checked)}
          />
          Ingresar un monto manual (ej. cobrar solo hasta donde se hizo)
        </label>
        {manual ? (
          <input
            name="precio_manual"
            type="number"
            min="0"
            step="0.01"
            defaultValue={trabajo?.precio_acordado ?? ''}
            placeholder="Monto manual (S/)"
            className={`${inputClass} mt-2`}
          />
        ) : null}
      </div>

      <label className="block space-y-1">
        <span className={labelText}>Notas (opcional)</span>
        <textarea
          name="notas"
          rows={2}
          defaultValue={trabajo?.notas ?? ''}
          className={`${inputClass} h-auto py-2`}
        />
      </label>

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
