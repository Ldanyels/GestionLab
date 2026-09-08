'use client'

import { useActionState, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { formatMoney } from '@/lib/format'
import { precioTotalTrabajo } from '@/lib/catalogo/precio'
import { TipoCombobox } from './TipoCombobox'
import type { FormState } from '@/app/(app)/trabajos/actions'
import type { DoctorOpcion } from '@/lib/consultorios/data'
import type { CatalogoTrabajo } from '@/lib/catalogo/types'
import type { TrabajoDetalle } from '@/lib/trabajos/types'

const initial: FormState = { error: '' }
// Base sin ancho ni padding: evita que las utilidades de Tailwind choquen entre sí
// (un `w-full`/`px-3` en la base gana por orden del CSS, no por orden en la cadena).
const campoBase =
  'h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-accent)]'
const inputClass = `w-full px-3 ${campoBase}`
const labelText = 'text-sm text-[var(--color-muted)]'
const stepperBtnClass =
  'h-11 w-11 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] text-xl leading-none active:border-[var(--color-accent)]'
// Contador: ancho fijo estrecho y sin flechas nativas (roban espacio en móvil).
const contadorClass = `${campoBase} w-14 shrink-0 px-1 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`

interface Linea {
  key: number
  tipoId: string
  cantidad: number
  varCantidad: number
  pieza: string
}

interface Props {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  doctores: DoctorOpcion[]
  tipos: CatalogoTrabajo[]
  trabajo?: TrabajoDetalle
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
  const [lineas, setLineas] = useState<Linea[]>(() =>
    trabajo && trabajo.items.length > 0
      ? trabajo.items.map((it, i) => ({
          key: i,
          tipoId: it.catalogo_trabajo_id,
          cantidad: it.cantidad,
          varCantidad: it.variable_cantidad,
          pieza: it.pieza ?? '',
        }))
      : [{ key: 0, tipoId: '', cantidad: 1, varCantidad: 1, pieza: '' }],
  )
  const [lineasError, setLineasError] = useState('')
  const [manual, setManual] = useState(false)

  const porId = useMemo(() => new Map(tipos.map((t) => [t.id, t])), [tipos])

  const subtotales = lineas.map((l) => {
    const tipo = porId.get(l.tipoId)
    if (!tipo) return 0
    return precioTotalTrabajo(tipo, l.cantidad, tipo.variable_etiqueta ? l.varCantidad : 0)
  })
  const total = Math.round(subtotales.reduce((s, x) => s + x, 0) * 100) / 100

  const itemsJson = JSON.stringify(
    lineas.map((l) => {
      const tipo = porId.get(l.tipoId)
      return {
        catalogo_trabajo_id: l.tipoId,
        cantidad: l.cantidad,
        variable_cantidad: tipo?.variable_etiqueta ? l.varCantidad : 0,
        pieza: l.pieza,
      }
    }),
  )

  function actualizar(key: number, cambios: Partial<Linea>) {
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...cambios } : l)))
    setLineasError('')
  }

  function agregarLinea() {
    setLineas((prev) => [
      ...prev,
      { key: Math.max(...prev.map((l) => l.key)) + 1, tipoId: '', cantidad: 1, varCantidad: 1, pieza: '' },
    ])
  }

  function quitarLinea(key: number) {
    setLineas((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev))
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (lineas.some((l) => !l.tipoId)) {
          e.preventDefault()
          setLineasError('Selecciona el tipo de trabajo en todas las líneas')
        }
      }}
      className="space-y-4"
    >
      {trabajo ? <input type="hidden" name="id" value={trabajo.id} /> : null}
      <input type="hidden" name="items" value={itemsJson} />

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

      <div className="space-y-2">
        <span className={labelText}>Trabajos de la cuenta</span>
        {lineas.map((l, idx) => {
          const tipo = porId.get(l.tipoId)
          return (
            <div
              key={l.key}
              className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <TipoCombobox
                    tipos={tipos}
                    value={l.tipoId}
                    onChange={(id) => actualizar(l.key, { tipoId: id })}
                  />
                </div>
                {lineas.length > 1 ? (
                  <button
                    type="button"
                    aria-label={`Quitar línea ${idx + 1}`}
                    onClick={() => quitarLinea(l.key)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-danger)]"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className={labelText}>Cantidad</span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label="Quitar una pieza"
                    onClick={() => actualizar(l.key, { cantidad: Math.max(1, l.cantidad - 1) })}
                    className={stepperBtnClass}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    aria-label="Cantidad de piezas"
                    value={l.cantidad}
                    onChange={(e) =>
                      actualizar(l.key, { cantidad: Math.max(1, Number(e.target.value) || 1) })
                    }
                    className={contadorClass}
                  />
                  <button
                    type="button"
                    aria-label="Agregar una pieza"
                    onClick={() => actualizar(l.key, { cantidad: l.cantidad + 1 })}
                    className={stepperBtnClass}
                  >
                    +
                  </button>
                </div>
              </div>

              <input
                aria-label="Pieza o diente"
                value={l.pieza}
                onChange={(e) => actualizar(l.key, { pieza: e.target.value })}
                placeholder="Pieza / diente (ej. 11, 21)"
                className={inputClass}
              />

              {tipo?.variable_etiqueta ? (
                <label className="block space-y-1">
                  <span className={labelText}>
                    {tipo.variable_etiqueta} por pieza (×{' '}
                    {formatMoney(tipo.variable_precio_unitario ?? 0)})
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={l.varCantidad}
                    onChange={(e) => actualizar(l.key, { varCantidad: Number(e.target.value) })}
                    className={inputClass}
                  />
                </label>
              ) : null}

              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Subtotal</span>
                <span className="num font-medium">{formatMoney(subtotales[idx] ?? 0)}</span>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={agregarLinea}
          className="h-11 w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] text-sm font-medium text-[var(--color-accent)]"
        >
          + Agregar otro trabajo
        </button>

        {lineasError ? (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {lineasError}
          </p>
        ) : null}

        {trabajo ? (
          <p className="text-xs text-[var(--color-muted)]">
            Al cambiar los trabajos de la cuenta, las etapas ya creadas no se recalculan.
          </p>
        ) : null}
      </div>

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
          <span className={labelText}>
            Total de la cuenta
            {lineas.length > 1 ? ` (${lineas.length} trabajos)` : ''}
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {manual ? 'Manual' : formatMoney(total)}
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
