'use client'

import { useState } from 'react'
import { marcarEtapaAction } from '@/app/(app)/trabajos/actions'
import {
  ETIQUETA_ETAPA,
  siguienteEstadoEtapa,
  type EstadoEtapa,
} from '@/lib/trabajos/estado'
import type { TrabajoEtapa } from '@/lib/trabajos/types'

const colorEstado: Record<EstadoEtapa, string> = {
  pendiente: 'text-[var(--color-muted)]',
  en_progreso: 'text-[var(--color-accent)]',
  completada: 'text-[var(--color-success)]',
  excluida: 'text-[var(--color-muted)] line-through',
}

const inputClass =
  'w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'

export function EtapaAcciones({ etapa }: { etapa: TrabajoEtapa }) {
  const [excluyendo, setExcluyendo] = useState(false)
  const siguiente = siguienteEstadoEtapa(etapa.estado)
  const puedeAvanzar = siguiente !== etapa.estado

  return (
    <li className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0">
          <span className={`block truncate font-medium ${colorEstado[etapa.estado]}`}>
            {etapa.nombre}
          </span>
          <span className="text-xs text-[var(--color-muted)]">
            {ETIQUETA_ETAPA[etapa.estado]}
            {etapa.estado === 'excluida' && etapa.motivo_exclusion
              ? ` · ${etapa.motivo_exclusion}`
              : ''}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2 text-sm">
          {puedeAvanzar ? (
            <form action={marcarEtapaAction}>
              <input type="hidden" name="id" value={etapa.id} />
              <input type="hidden" name="trabajo_id" value={etapa.trabajo_id} />
              <input type="hidden" name="estado" value={siguiente} />
              <button type="submit" className="text-[var(--color-accent)]">
                {siguiente === 'completada' ? 'Completar' : 'Iniciar'}
              </button>
            </form>
          ) : null}

          {etapa.estado !== 'pendiente' ? (
            <form action={marcarEtapaAction}>
              <input type="hidden" name="id" value={etapa.id} />
              <input type="hidden" name="trabajo_id" value={etapa.trabajo_id} />
              <input type="hidden" name="estado" value="pendiente" />
              <button type="submit" className="text-[var(--color-muted)]">
                Reabrir
              </button>
            </form>
          ) : null}

          {etapa.estado !== 'excluida' ? (
            <button
              type="button"
              onClick={() => setExcluyendo((v) => !v)}
              className="text-[var(--color-muted)]"
            >
              Excluir
            </button>
          ) : null}
        </span>
      </div>

      {excluyendo ? (
        <form action={marcarEtapaAction} className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="id" value={etapa.id} />
          <input type="hidden" name="trabajo_id" value={etapa.trabajo_id} />
          <input type="hidden" name="estado" value="excluida" />
          <input
            name="motivo"
            required
            placeholder="Motivo (ej. la hace proveedor externo)"
            className={inputClass}
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-danger)] px-3 text-sm font-medium text-white"
          >
            Excluir etapa
          </button>
        </form>
      ) : null}
    </li>
  )
}
