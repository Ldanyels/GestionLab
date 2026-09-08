'use client'

import { useActionState, useMemo, useState } from 'react'
import { formatMoney } from '@/lib/format'
import { precioTotalTrabajo } from '@/lib/catalogo/precio'
import { Card } from '@/components/ui/Card'
import { TipoSheet } from './TipoSheet'
import type { FormState } from '@/app/(app)/trabajos/actions'
import type { DoctorOpcion } from '@/lib/consultorios/data'
import type { CatalogoTrabajo } from '@/lib/catalogo/types'
import type { TrabajoDetalle } from '@/lib/trabajos/types'

const initial: FormState = { error: '' }
const campoBase =
  'h-12 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] outline-none focus:border-[var(--color-accent)]'
const campo = `w-full px-3 ${campoBase}`
const etiqueta = 'text-[13px] font-semibold text-[var(--color-muted)]'
const stepperBtn =
  'h-11 w-[46px] shrink-0 text-xl leading-none text-[var(--color-text)] transition-colors active:text-[var(--color-accent)]'

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
  /** Índice de la línea que abrió la hoja de tipos; null = cerrada. */
  const [eligiendo, setEligiendo] = useState<number | null>(null)

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
      {
        key: Math.max(...prev.map((l) => l.key)) + 1,
        tipoId: '',
        cantidad: 1,
        varCantidad: 1,
        pieza: '',
      },
    ])
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (lineas.some((l) => !l.tipoId)) {
          e.preventDefault()
          setLineasError('Elige el tipo de trabajo en todas las líneas')
        }
      }}
      className="space-y-4"
    >
      {trabajo ? <input type="hidden" name="id" value={trabajo.id} /> : null}
      <input type="hidden" name="items" value={itemsJson} />

      <Card className="space-y-1 p-3.5">
        <label className="block space-y-1">
          <span className={etiqueta}>Consultorio y doctor</span>
          <select
            name="doctor_id"
            required
            defaultValue={trabajo?.doctor_id ?? doctorInicial ?? ''}
            className={campo}
          >
            <option value="" disabled>
              Elige un doctor…
            </option>
            {doctores.map((d) => (
              <option key={d.id} value={d.id}>
                {d.consultorio_nombre} — {d.nombre}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-bold">Trabajos de la cuenta</h2>
          <span className="num shrink-0 text-[13px] text-[var(--color-muted)]">
            {lineas.length} línea{lineas.length === 1 ? '' : 's'}
          </span>
        </div>

        {lineas.map((l, idx) => {
          const tipo = porId.get(l.tipoId)
          return (
            <Card key={l.key} className="space-y-3 p-3.5">
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => setEligiendo(l.key)}
                  className={`flex min-h-12 min-w-0 flex-1 items-center justify-between gap-2 px-3 text-left ${campoBase} hover:border-[var(--color-accent)]`}
                >
                  <span className={`min-w-0 truncate ${tipo ? '' : 'text-[var(--color-muted)]'}`}>
                    {tipo ? tipo.nombre : 'Elegir tipo de trabajo…'}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {tipo ? (
                      <span className="num text-[13.5px] text-[var(--color-muted)]">
                        {formatMoney(tipo.precio_base)}
                      </span>
                    ) : null}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="text-[var(--color-muted)]"
                      aria-hidden
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>

                {lineas.length > 1 ? (
                  <button
                    type="button"
                    aria-label={`Quitar línea ${idx + 1}`}
                    onClick={() =>
                      setLineas((prev) =>
                        prev.length > 1 ? prev.filter((x) => x.key !== l.key) : prev,
                      )
                    }
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-lg text-[var(--color-danger)]"
                  >
                    ×
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={etiqueta}>Cantidad</span>
                <div className="flex shrink-0 items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
                  <button
                    type="button"
                    aria-label="Quitar una pieza"
                    onClick={() => actualizar(l.key, { cantidad: Math.max(1, l.cantidad - 1) })}
                    className={stepperBtn}
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
                    className="num h-11 w-[52px] border-x border-[var(--color-border)] bg-transparent text-center text-base font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label="Agregar una pieza"
                    onClick={() => actualizar(l.key, { cantidad: l.cantidad + 1 })}
                    className={stepperBtn}
                  >
                    +
                  </button>
                </div>
                <input
                  aria-label="Pieza o diente"
                  value={l.pieza}
                  onChange={(e) => actualizar(l.key, { pieza: e.target.value })}
                  placeholder="Pieza / diente (11, 21)"
                  className={`${campoBase} min-w-0 flex-[1_1_150px] px-3`}
                />
              </div>

              {tipo?.variable_etiqueta ? (
                <label className="block space-y-1">
                  <span className={etiqueta}>
                    {tipo.variable_etiqueta} por pieza (×{' '}
                    {formatMoney(tipo.variable_precio_unitario ?? 0)})
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={l.varCantidad}
                    onChange={(e) => actualizar(l.key, { varCantidad: Number(e.target.value) })}
                    className={campo}
                  />
                </label>
              ) : null}

              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2.5 text-[13px]">
                <span className="text-[var(--color-muted)]">Subtotal</span>
                <span className="num text-base font-bold">
                  {formatMoney(subtotales[idx] ?? 0)}
                </span>
              </div>
            </Card>
          )
        })}

        <button
          type="button"
          onClick={agregarLinea}
          className="h-12 w-full rounded-[var(--radius-md)] border-[1.5px] border-dashed border-[var(--color-border)] text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-soft)]"
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
            Al cambiar las líneas, las etapas ya creadas no se recalculan.
          </p>
        ) : null}
      </div>

      <Card className="space-y-3 p-3.5">
        <label className="block space-y-1">
          <span className={etiqueta}>
            Paciente <span className="font-normal">(opcional)</span>
          </span>
          <input
            name="paciente_nombre"
            defaultValue={trabajo?.paciente_nombre ?? ''}
            placeholder="Nombre del paciente"
            className={campo}
          />
        </label>
        <label className="block space-y-1">
          <span className={etiqueta}>
            Fecha de entrega <span className="font-normal">(opcional)</span>
          </span>
          <input
            name="fecha_entrega"
            type="date"
            defaultValue={trabajo?.fecha_entrega ?? ''}
            className={campo}
          />
        </label>
        <label className="block space-y-1">
          <span className={etiqueta}>
            Notas <span className="font-normal">(opcional)</span>
          </span>
          <textarea
            name="notas"
            rows={3}
            defaultValue={trabajo?.notas ?? ''}
            className={`${campo} h-auto py-2`}
          />
        </label>
      </Card>

      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}

      {/* Barra de total: siempre visible sobre la navegación. */}
      <div className="sticky bottom-[76px] z-10 space-y-3 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-[var(--shadow-pop)] min-[980px]:bottom-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[var(--color-muted)]">
            Total de la cuenta
          </span>
          <span className="num text-[26px] font-bold leading-none">
            {manual ? '—' : formatMoney(total)}
          </span>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={manual}
            onChange={(e) => setManual(e.target.checked)}
            className="mt-0.5 size-5 shrink-0"
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
            className={campo}
          />
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="h-[52px] w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-base font-semibold text-[var(--color-accent-contrast)] transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? 'Guardando…' : submitLabel}
        </button>
      </div>

      <TipoSheet
        tipos={tipos}
        abierta={eligiendo !== null}
        onCerrar={() => setEligiendo(null)}
        onElegir={(id) => {
          if (eligiendo !== null) actualizar(eligiendo, { tipoId: id })
        }}
      />
    </form>
  )
}
