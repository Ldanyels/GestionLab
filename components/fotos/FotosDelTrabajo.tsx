'use client'

import { useRef, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { comprimirImagen } from '@/lib/fotos/comprimir'
import { BUCKET, type FotoConEnlace } from '@/lib/fotos/tipos'
import { ETIQUETA_MOMENTO, MAX_POR_MOMENTO, type MomentoFoto } from '@/lib/fotos/reglas'
import { useConexion } from '@/components/conexion/useConexion'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  eliminarFotoAction,
  reservarFotoAction,
  type ReservaState,
} from '@/app/(app)/trabajos/[id]/fotos/actions'

/**
 * Fotos de un trabajo: cómo llegó y cómo se entregó.
 *
 * El consultorio manda una pieza en cierto estado y la recibe en otro. Cuando
 * hay discrepancia, esto es lo único que cierra la conversación.
 *
 * La foto va **del teléfono directo a Supabase**, comprimida antes de salir. Sin
 * comprimir son 3–8 MB que con el wifi de un taller tardan decenas de segundos
 * y fallan a menudo; reducida queda en unos 300 KB.
 */
export function FotosDelTrabajo({
  trabajoId,
  fotos,
  puedeEditar,
}: {
  trabajoId: string
  fotos: FotoConEnlace[]
  /** Si es falso, solo se ven. El servidor lo comprueba igual. */
  puedeEditar: boolean
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-[17px] font-bold">Fotos del trabajo</h2>
      {(['recepcion', 'entrega'] as MomentoFoto[]).map((m) => (
        <GrupoDeFotos
          key={m}
          trabajoId={trabajoId}
          momento={m}
          fotos={fotos.filter((f) => f.momento === m)}
          puedeEditar={puedeEditar}
        />
      ))}
    </div>
  )
}

function GrupoDeFotos({
  trabajoId,
  momento,
  fotos,
  puedeEditar,
}: {
  trabajoId: string
  momento: MomentoFoto
  fotos: FotoConEnlace[]
  puedeEditar: boolean
}) {
  const enLinea = useConexion()
  const entrada = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  const lleno = fotos.length >= MAX_POR_MOMENTO

  async function subir(archivo: File) {
    setError('')
    setSubiendo(true)
    let reserva: ReservaState | null = null
    try {
      // 1. El servidor decide si cabe y dónde va. El navegador no puede saltarse
      //    el tope de dos: está en el contrato de encargo.
      const datos = new FormData()
      datos.set('trabajo_id', trabajoId)
      datos.set('momento', momento)
      reserva = await reservarFotoAction({ error: '', ruta: '', fotoId: '' }, datos)
      if (reserva.error) {
        setError(reserva.error)
        return
      }

      // 2. Comprimir y subir directo a Supabase, sin pasar por el servidor.
      const blob = await comprimirImagen(archivo)
      const supabase = createBrowserSupabase()
      const { error: errSubida } = await supabase.storage
        .from(BUCKET)
        .upload(reserva.ruta, blob, { contentType: 'image/jpeg', upsert: true })
      if (errSubida) throw new Error(errSubida.message)

      // Recarga para que la ficha traiga la foto con su enlace firmado.
      window.location.reload()
    } catch (e) {
      /*
        Si algo falla después de reservar, se suelta la posición.

        Sin esto, una subida interrumpida —se cortó el wifi a mitad— dejaría el
        hueco ocupado por una foto que no existe, y nadie podría volver a
        usarlo sin entender por qué.
      */
      if (reserva?.fotoId) {
        const limpiar = new FormData()
        limpiar.set('id', reserva.fotoId)
        limpiar.set('trabajo_id', trabajoId)
        await eliminarFotoAction(limpiar).catch(() => {})
      }
      setError(e instanceof Error ? e.message : 'No se pudo subir la foto')
    } finally {
      setSubiendo(false)
      if (entrada.current) entrada.current.value = ''
    }
  }

  return (
    <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[14.5px] font-semibold">{ETIQUETA_MOMENTO[momento]}</h3>
        <span className="num text-[12.5px] text-[var(--color-muted)]">
          {fotos.length} de {MAX_POR_MOMENTO}
        </span>
      </div>

      {fotos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {fotos.map((f) => (
            <li key={f.id} className="space-y-1">
              {f.url ? (
                /*
                  Abre en una pestaña nueva para verla en grande. Sin `<Image>`
                  de Next a propósito: su optimizador necesitaría acceso al
                  archivo, y estas imágenes viven tras enlaces firmados que
                  caducan en una hora.
                */
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={f.url}
                    alt={`${ETIQUETA_MOMENTO[momento]} — foto ${f.orden}`}
                    loading="lazy"
                    className="aspect-square w-full rounded-[var(--radius-md)] border border-[var(--color-border)] object-cover"
                  />
                </a>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-2 text-center text-[12px] text-[var(--color-muted)]">
                  No se pudo cargar
                </div>
              )}
              {puedeEditar ? (
                <ConfirmDialog
                  action={eliminarFotoAction}
                  fields={{ id: f.id, trabajo_id: trabajoId }}
                  triggerLabel="Eliminar"
                  triggerClassName="text-[12.5px] font-semibold text-[var(--color-danger)]"
                  title="Eliminar foto"
                  message="Se borra la imagen y no se puede recuperar."
                  confirmLabel="Sí, eliminar"
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12.5px] text-[var(--color-muted)]">
          Sin fotos de este momento.
        </p>
      )}

      {puedeEditar && !lleno ? (
        <>
          {/*
            Un solo `accept="image/*"` sin `capture`: en el teléfono el sistema
            ofrece cámara y galería, que es justo lo que se pidió. Forzar
            `capture` abriría la cámara siempre y quitaría la galería.
          */}
          <input
            ref={entrada}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              if (archivo) void subir(archivo)
            }}
          />
          <button
            type="button"
            disabled={subiendo || !enLinea}
            onClick={() => entrada.current?.click()}
            className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-accent)] disabled:opacity-50 sm:w-auto sm:px-4"
          >
            {!enLinea ? 'Sin conexión' : subiendo ? 'Subiendo…' : 'Añadir foto'}
          </button>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="text-[13px] text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
