'use client'

import { useState } from 'react'
import { CATALOGO_PERMISOS, normalizarPermisos, type Permiso } from '@/lib/permisos'
import { guardarPermisosAction } from '@/app/(app)/configuracion/usuarios/actions'

interface Props {
  usuarioId: string
  nombre: string
  permisos: string[]
}

/** Casillas de permisos de un técnico. Se guarda al tocar "Guardar permisos". */
export function PermisosEditor({ usuarioId, nombre, permisos }: Props) {
  const inicial = normalizarPermisos(permisos)
  const [marcados, setMarcados] = useState<Permiso[]>(inicial)

  const cambio = (id: Permiso, activo: boolean) => {
    setMarcados((prev) =>
      normalizarPermisos(activo ? [...prev, id] : prev.filter((p) => p !== id)),
    )
  }

  const sinCambios =
    marcados.length === inicial.length && marcados.every((p) => inicial.includes(p))

  return (
    <form action={guardarPermisosAction} className="space-y-2">
      <input type="hidden" name="id" value={usuarioId} />
      <fieldset className="space-y-1.5">
        <legend className="pb-1 text-[12.5px] font-semibold text-[var(--color-muted)]">
          Permisos de {nombre}
        </legend>
        {CATALOGO_PERMISOS.map((p) => {
          const activo = marcados.includes(p.id)
          return (
            <label
              key={p.id}
              className={`flex w-full cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border p-3 transition-colors ${
                activo
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <input
                type="checkbox"
                name={p.id}
                checked={activo}
                onChange={(e) => cambio(p.id, e.target.checked)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border ${
                  activo
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {activo ? (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block text-[14.5px] font-semibold">{p.etiqueta}</span>
                <span className="block text-[12.5px] leading-[1.45] text-[var(--color-muted)]">
                  {p.descripcion}
                </span>
              </span>
            </label>
          )
        })}
      </fieldset>
      <button
        type="submit"
        disabled={sinCambios}
        className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] text-[13px] font-semibold transition-colors hover:border-[var(--color-accent)] disabled:opacity-40 disabled:hover:border-[var(--color-border)]"
      >
        {sinCambios ? 'Sin cambios' : 'Guardar permisos'}
      </button>
    </form>
  )
}
