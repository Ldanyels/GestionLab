'use client'

import { useMemo, useState } from 'react'
import { filtrarTipos } from '@/lib/catalogo/filtro'
import { formatMoney } from '@/lib/format'
import type { CatalogoTrabajo } from '@/lib/catalogo/types'

const campoClass =
  'w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'

interface Props {
  tipos: CatalogoTrabajo[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  labelId?: string
}

/** Selector de tipo de trabajo con buscador (filtra por nombre y categoría). */
export function TipoCombobox({ tipos, value, onChange, disabled, labelId }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')

  const seleccionado = useMemo(
    () => tipos.find((t) => t.id === value),
    [tipos, value],
  )
  const filtrados = useMemo(() => filtrarTipos(tipos, q), [tipos, q])
  const categorias = useMemo(
    () => [...new Set(filtrados.map((t) => t.categoria))],
    [filtrados],
  )

  if (disabled) {
    return (
      <div className={`${campoClass} flex items-center text-[var(--color-muted)]`}>
        {seleccionado ? seleccionado.nombre : '—'}
      </div>
    )
  }

  return (
    <div className="relative">
      {abierto ? (
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar tipo de trabajo…"
          aria-label="Buscar tipo de trabajo"
          className={campoClass}
        />
      ) : (
        <button
          type="button"
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          onClick={() => {
            setQ('')
            setAbierto(true)
          }}
          className={`${campoClass} flex items-center justify-between gap-2 text-left`}
        >
          <span className={`min-w-0 truncate ${seleccionado ? '' : 'text-[var(--color-muted)]'}`}>
            {seleccionado ? seleccionado.nombre : 'Selecciona un tipo…'}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {seleccionado ? (
              <span className="num text-sm text-[var(--color-muted)]">
                {formatMoney(seleccionado.precio_base)}
              </span>
            ) : null}
            <span aria-hidden className="text-[var(--color-muted)]">
              ⌄
            </span>
          </span>
        </button>
      )}

      {abierto ? (
        <>
          {/* Fondo invisible: cierra el desplegable al tocar fuera. */}
          <div
            aria-hidden
            className="fixed inset-0 z-10"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
            {filtrados.length === 0 ? (
              <p className="p-3 text-sm text-[var(--color-muted)]">
                Sin resultados para “{q}”.
              </p>
            ) : (
              categorias.map((cat) => (
                <div key={cat}>
                  <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    {cat}
                  </p>
                  {filtrados
                    .filter((t) => t.categoria === cat)
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onChange(t.id)
                          setAbierto(false)
                        }}
                        className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm active:bg-[var(--color-border)] ${
                          t.id === value ? 'text-[var(--color-accent)]' : ''
                        }`}
                      >
                        <span className="min-w-0 truncate">{t.nombre}</span>
                        <span className="num shrink-0 text-[var(--color-muted)]">
                          {formatMoney(t.precio_base)}
                          {t.variable_etiqueta ? ' +' : ''}
                        </span>
                      </button>
                    ))}
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
