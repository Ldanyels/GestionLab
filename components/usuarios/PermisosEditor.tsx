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
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-[var(--color-muted)]">
          Permisos de {nombre}
        </legend>
        {CATALOGO_PERMISOS.map((p) => (
          <label key={p.id} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name={p.id}
              checked={marcados.includes(p.id)}
              onChange={(e) => cambio(p.id, e.target.checked)}
              className="mt-1 size-4 shrink-0"
            />
            <span className="min-w-0">
              <span className="block">{p.etiqueta}</span>
              <span className="block text-xs text-[var(--color-muted)]">
                {p.descripcion}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <button
        type="submit"
        disabled={sinCambios}
        className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] text-xs font-medium disabled:opacity-40"
      >
        {sinCambios ? 'Sin cambios' : 'Guardar permisos'}
      </button>
    </form>
  )
}
