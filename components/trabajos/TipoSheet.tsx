'use client'

import { useMemo, useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { filtrarTipos } from '@/lib/catalogo/filtro'
import { formatMoney } from '@/lib/format'
import type { CatalogoTrabajo } from '@/lib/catalogo/types'

interface Props {
  tipos: CatalogoTrabajo[]
  abierta: boolean
  onCerrar: () => void
  onElegir: (id: string) => void
}

/** Hoja inferior para elegir el tipo de trabajo, con buscador (spec 6.1). */
export function TipoSheet({ tipos, abierta, onCerrar, onElegir }: Props) {
  const [q, setQ] = useState('')

  const filtrados = useMemo(() => filtrarTipos(tipos, q), [tipos, q])
  const categorias = useMemo(
    () => [...new Set(filtrados.map((t) => t.categoria))],
    [filtrados],
  )

  const elegir = (id: string) => {
    onElegir(id)
    setQ('')
    onCerrar()
  }

  return (
    <Sheet abierta={abierta} onCerrar={onCerrar} titulo="Tipo de trabajo">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Buscar tipo de trabajo"
        placeholder="Buscar por nombre o categoría…"
        className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-surface-2)] px-3 outline-none"
      />

      {filtrados.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--color-muted)]">
          Sin resultados para «{q}».
        </p>
      ) : (
        <div className="mt-2">
          {categorias.map((cat) => (
            <div key={cat}>
              <p className="px-1 pb-1 pt-3 text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                {cat}
              </p>
              {filtrados
                .filter((t) => t.categoria === cat)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => elegir(t.id)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-accent-soft)]"
                  >
                    <span className="min-w-0 text-[14.5px]">{t.nombre}</span>
                    <span className="num shrink-0 text-[13.5px] text-[var(--color-muted)]">
                      {formatMoney(t.precio_base)}
                      {t.variable_etiqueta
                        ? ` + ${formatMoney(t.variable_precio_unitario ?? 0)} / ${t.variable_etiqueta}`
                        : ''}
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </Sheet>
  )
}
