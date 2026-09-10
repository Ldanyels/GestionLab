'use client'

import { useActionState } from 'react'
import type { DocumentoLegal } from '@/lib/legal/textos.generated'

const campo =
  'h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] outline-none focus:border-[var(--color-accent)]'
const etiqueta = 'text-[13px] font-semibold text-[var(--color-muted)]'

interface Props {
  documentos: readonly DocumentoLegal[]
  laboratorio: string
  action: (prev: { error: string }, formData: FormData) => Promise<{ error: string }>
  errorInicial?: string
}

/**
 * Aceptación de los documentos legales. Bloquea el acceso hasta completarla.
 *
 * Muestra el **texto completo** de cada documento, no un enlace: nadie acepta
 * lo que no puede leer, y un registro de aceptación sobre un texto que no
 * estaba a la vista es lo primero que un abogado atacaría.
 *
 * Una casilla por documento, no una sola para los tres. Y la versión de cada
 * uno visible: es la huella que permite demostrar después qué se aceptó.
 *
 * No pide subir la imagen del DNI. Con el número basta para identificar a
 * quien acepta, y guardar el documento sería recoger más datos de los
 * necesarios además de convertir esto en un archivo de identidades.
 */
export function PantallaAceptacion({
  documentos,
  laboratorio,
  action,
  errorInicial = '',
}: Props) {
  const [state, enviar, pending] = useActionState(action, { error: errorInicial })
  const error = state.error || errorInicial
  const esActualizacion = documentos.length < 3

  return (
    <main className="mx-auto w-full max-w-[760px] px-4 py-8">
      <header className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent)]">
          Antes de continuar
        </p>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">
          {esActualizacion
            ? 'Actualizamos nuestras condiciones'
            : 'Condiciones del servicio'}
        </h1>
        <p className="text-[14.5px] leading-relaxed text-[var(--color-muted)]">
          {esActualizacion
            ? `Cambió lo siguiente y necesitamos que ${laboratorio} lo revise para seguir usando el sistema.`
            : `Para que ${laboratorio} pueda usar GestionLab, quien lo representa debe leer y aceptar estos documentos. Guardaremos constancia de esta aceptación y te enviaremos una copia por correo.`}
        </p>
      </header>

      <form action={enviar} className="mt-6 space-y-5">
        {documentos.map((d) => (
          <section
            key={d.clave}
            className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2.5">
              <h2 className="text-[15.5px] font-bold">{d.titulo}</h2>
              <span className="num text-[11.5px] text-[var(--color-muted)]">
                versión {d.version}
              </span>
            </div>

            {/*
              El texto va con scroll propio y no colapsado: se puede leer sin
              salir de la pantalla, y la altura limitada evita que tres
              documentos completos hagan interminable el desplazamiento.

              `dangerouslySetInnerHTML` es seguro aquí: el HTML lo genera
              `scripts/sellar-legales.mjs` a partir de archivos del repositorio,
              no de nada que escriba un usuario.
            */}
            <div
              className="prose-legal max-h-[320px] overflow-y-auto px-3.5 py-3 text-[13.5px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: d.html }}
            />

            <label className="flex cursor-pointer items-start gap-2.5 border-t border-[var(--color-border)] px-3.5 py-3">
              <input
                type="checkbox"
                name="documento"
                value={d.clave}
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
              />
              <span className="text-[13.5px] font-semibold">
                He leído y acepto {d.titulo}
              </span>
            </label>
          </section>
        ))}

        <fieldset className="space-y-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3.5">
          <legend className="px-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent)]">
            Quién acepta
          </legend>

          <label className="block space-y-1">
            <span className={etiqueta}>Nombre completo</span>
            <input name="nombre" type="text" maxLength={120} required className={campo} />
          </label>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className={etiqueta}>DNI</span>
              <input
                name="dni"
                type="text"
                inputMode="numeric"
                pattern="\d{8}"
                maxLength={8}
                required
                className={campo}
              />
            </label>
            <label className="block space-y-1">
              <span className={etiqueta}>Cargo (opcional)</span>
              <input name="cargo" type="text" maxLength={80} className={campo} />
            </label>
          </div>

          <p className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
            Quedará registrada la fecha, la dirección desde la que aceptas y la versión de
            cada documento. No pedimos ninguna fotografía ni copia de tu documento de
            identidad.
          </p>
        </fieldset>

        {error ? (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="h-[50px] w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-base font-semibold text-[var(--color-accent-contrast)] transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? 'Registrando…' : 'Acepto y continúo'}
        </button>

        <p className="text-center text-[12.5px] text-[var(--color-muted)]">
          Si no estás de acuerdo, no continúes y escríbenos: no podemos prestar el servicio
          sin estas condiciones.
        </p>
      </form>
    </main>
  )
}
