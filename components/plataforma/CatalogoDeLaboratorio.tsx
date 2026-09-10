'use client'

import { useActionState } from 'react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import type { ItemDeCatalogo } from '@/lib/plataforma/laboratorio-detalle'

const campo =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'
const etiqueta =
  'block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]'

/** Agrupa por categoría conservando el orden en que vienen. */
function porCategoria(items: readonly ItemDeCatalogo[]): [string, ItemDeCatalogo[]][] {
  const grupos = new Map<string, ItemDeCatalogo[]>()
  for (const i of items) {
    const lista = grupos.get(i.categoria)
    if (lista) lista.push(i)
    else grupos.set(i.categoria, [i])
  }
  return [...grupos.entries()]
}

/**
 * Catálogo de un laboratorio ajeno: corregir precios base y añadir tipos.
 *
 * Los archivados se muestran igual, marcados: siguen apareciendo en trabajos
 * antiguos, así que su precio también puede necesitar corrección, pero hay que
 * poder distinguirlos de los que el laboratorio usa hoy.
 */
export function CatalogoDeLaboratorio({
  labId,
  items,
  corregirPrecio,
  crear,
}: {
  labId: string
  items: readonly ItemDeCatalogo[]
  corregirPrecio: (formData: FormData) => Promise<void>
  crear: (prev: { error: string }, formData: FormData) => Promise<{ error: string }>
}) {
  const [estado, enviarNuevo, pendiente] = useActionState(crear, { error: '' })

  return (
    <div className="space-y-5">
      <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
        Corregir un precio base <strong className="font-semibold">no cambia los trabajos ya
        registrados</strong>: el precio de cada uno se acordó con su consultorio el día que
        entró. Solo afecta a los que se registren de aquí en adelante.
      </p>

      {items.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[14px] font-semibold">Este laboratorio no tiene catálogo</p>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">
            Sin al menos un tipo de trabajo, no puede registrar trabajos.
          </p>
        </div>
      ) : (
        porCategoria(items).map(([categoria, lista]) => (
          <section key={categoria} className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent)]">
              {categoria}
            </h3>
            <ul className="space-y-2">
              {lista.map((i) => (
                <li key={i.id}>
                  <Card tono="lista" className="space-y-2.5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-[14.5px] font-semibold">{i.nombre}</p>
                      {i.activo ? null : <Chip tono="neutro">Archivado</Chip>}
                    </div>
                    <form action={corregirPrecio} className="flex items-end gap-2">
                      <input type="hidden" name="laboratorio_id" value={labId} />
                      <input type="hidden" name="item_id" value={i.id} />
                      <label className="space-y-1">
                        <span className={etiqueta}>Precio base</span>
                        <input
                          name="precio_base"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={i.precio_base}
                          required
                          className={`${campo} w-[130px]`}
                        />
                      </label>
                      <button
                        type="submit"
                        className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-[13px] font-semibold"
                      >
                        Guardar
                      </button>
                    </form>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <Card tono="lista" className="space-y-3 p-3.5">
        <h3 className="text-[15px] font-bold">Añadir un tipo</h3>
        <form action={enviarNuevo} className="space-y-2.5">
          <input type="hidden" name="laboratorio_id" value={labId} />
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className={etiqueta}>Categoría</span>
              <input name="categoria" type="text" maxLength={80} required className={campo} />
            </label>
            <label className="space-y-1">
              <span className={etiqueta}>Precio</span>
              <input
                name="precio_base"
                type="number"
                step="0.01"
                min="0"
                defaultValue={0}
                required
                className={campo}
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className={etiqueta}>Nombre</span>
            <input name="nombre" type="text" maxLength={150} required className={campo} />
          </label>
          {/*
            El plazo se captura aquí porque la carga del catálogo es el único
            momento en que alguien repasa el catálogo tipo por tipo. Si no se
            pregunta ahora, no se pregunta nunca.
          */}
          <label className="block space-y-1">
            <span className={etiqueta}>Días de entrega (opcional)</span>
            <input
              name="dias_entrega"
              type="number"
              step="1"
              min="0"
              max="365"
              placeholder="Ej. 3"
              className={campo}
            />
          </label>

          {estado.error ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {estado.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pendiente}
            className="h-11 w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-contrast)] disabled:opacity-50"
          >
            {pendiente ? 'Añadiendo…' : 'Añadir al catálogo'}
          </button>
        </form>
      </Card>
    </div>
  )
}
