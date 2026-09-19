'use client'

import { useEffect, useRef, useState } from 'react'
import { MAX_POR_MOMENTO } from '@/lib/fotos/reglas'

/**
 * Las fotos de «cómo llegó», elegidas **antes** de que el trabajo exista.
 *
 * Una foto se guarda en una carpeta que lleva el id del trabajo, así que no se
 * puede subir hasta que el trabajo esté creado. Aquí solo se retienen en el
 * navegador y se muestran; el formulario las sube en cuanto tiene el id.
 *
 * Es lo que permite registrar la pieza como llegó en el mismo momento en que se
 * recibe, que es cuando se tiene delante. Obligar a guardar primero y volver a
 * entrar a la ficha es la clase de paso que no se da.
 */
export function FotosAlCrear({
  archivos,
  onCambiar,
  deshabilitado,
}: {
  archivos: File[]
  onCambiar: (archivos: File[]) => void
  /** Durante el guardado no se pueden cambiar. */
  deshabilitado?: boolean
}) {
  const camara = useRef<HTMLInputElement>(null)
  const galeria = useRef<HTMLInputElement>(null)
  const [vistas, setVistas] = useState<string[]>([])

  /*
    Las miniaturas se crean con `createObjectURL` y hay que soltarlas.

    Cada llamada reserva memoria del navegador que no se libera sola; sin el
    `revoke`, elegir y descartar fotos varias veces la va acumulando —y en un
    teléfono con una foto de cámara por medio eso se nota.
  */
  useEffect(() => {
    const urls = archivos.map((a) => URL.createObjectURL(a))
    setVistas(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [archivos])

  const lleno = archivos.length >= MAX_POR_MOMENTO

  function agregar(archivo: File | undefined) {
    if (!archivo || lleno) return
    onCambiar([...archivos, archivo])
  }

  function quitar(i: number) {
    onCambiar(archivos.filter((_, n) => n !== i))
  }

  const boton =
    'inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold disabled:opacity-50'

  return (
    <div className="space-y-2">
      {archivos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {archivos.map((a, i) => (
            <li key={`${a.name}-${i}`} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vistas[i]}
                alt={`Foto ${i + 1} de cómo llegó`}
                className="aspect-square w-full rounded-[var(--radius-md)] border border-[var(--color-border)] object-cover"
              />
              <button
                type="button"
                onClick={() => quitar(i)}
                disabled={deshabilitado}
                className="text-[12.5px] font-semibold text-[var(--color-danger)]"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!lleno ? (
        <>
          {/*
            Dos entradas, igual que en la ficha del trabajo: `capture` es lo que
            abre la cámara —la trasera, que la pieza está sobre la mesa— pero
            esa misma entrada deja de servir para la galería.
          */}
          <input
            ref={camara}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              agregar(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <input
            ref={galeria}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              agregar(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={deshabilitado}
              onClick={() => camara.current?.click()}
              className={`${boton} flex-1 text-[var(--color-accent)]`}
            >
              Cámara
            </button>
            <button
              type="button"
              disabled={deshabilitado}
              onClick={() => galeria.current?.click()}
              className={`${boton} shrink-0 text-[var(--color-muted)]`}
            >
              Galería
            </button>
          </div>
        </>
      ) : null}

      <p className="text-[12px] text-[var(--color-muted)]">
        {archivos.length} de {MAX_POR_MOMENTO}
        {archivos.length > 0 ? ' · se suben al guardar el trabajo' : ' · opcional'}
      </p>
    </div>
  )
}
