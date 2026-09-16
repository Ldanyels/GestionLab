import Link from 'next/link'
import { formatMoney } from '@/lib/format'
import { ETIQUETA_TRABAJO } from '@/lib/trabajos/estado'
import type { PosibleDuplicado } from '@/lib/trabajos/duplicados-data'
import type { EstadoTrabajo } from '@/lib/trabajos/estado'

/**
 * Aviso de que el trabajo puede estar ya registrado.
 *
 * Aparece cuando coinciden las tres validaciones —consultorio, paciente y tipo—
 * en los cinco días anteriores. En ese momento **el trabajo todavía no se
 * guardó**: hace falta una decisión.
 *
 * Muestra lo que ya existe con todo lo que hace falta para reconocerlo —fecha,
 * doctor, importe y estado— y un enlace para abrirlo. Un aviso que solo dijera
 * «puede estar duplicado» obligaría a salir del formulario a comprobarlo, y a
 * perder lo escrito por el camino.
 */
export function AvisoDeDuplicado({
  duplicados,
  onCancelar,
}: {
  duplicados: PosibleDuplicado[]
  /** Vuelve al formulario sin guardar, por si hay algo mal escrito. */
  onCancelar: () => void
}) {
  const varios = duplicados.length > 1

  return (
    <div
      role="alert"
      className="space-y-3 rounded-[var(--radius-lg)] border-2 border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3.5"
    >
      <div>
        <p className="text-[15.5px] font-bold text-[var(--color-danger)]">
          Puede que este trabajo ya esté registrado
        </p>
        <p className="mt-0.5 text-[13px] leading-relaxed">
          {varios
            ? `Hay ${duplicados.length} trabajos del mismo consultorio, para el mismo paciente y del mismo tipo en los últimos 5 días.`
            : 'Hay un trabajo del mismo consultorio, para el mismo paciente y del mismo tipo en los últimos 5 días.'}{' '}
          <strong className="font-semibold">Todavía no se ha guardado nada.</strong>
        </p>
      </div>

      <ul className="space-y-2">
        {duplicados.map((d) => (
          <li
            key={d.id}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold">
                  {d.tipo_nombre}
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-[var(--color-muted)]">
                  {d.paciente_nombre} · {d.doctor_nombre} — {d.consultorio_nombre}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-[var(--color-muted)]">
                  Ingresó el {d.fecha_ingreso} ·{' '}
                  {ETIQUETA_TRABAJO[d.estado as EstadoTrabajo] ?? d.estado}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="num block text-[14px] font-bold">
                  {formatMoney(d.precio_acordado)}
                </span>
                {/*
                  Se abre en otra pestaña a propósito: mirar el trabajo
                  existente no puede costar lo que ya se escribió en este
                  formulario.
                */}
                <Link
                  href={`/trabajos/${d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-[12.5px] font-semibold text-[var(--color-accent)]"
                >
                  Ver ↗
                </Link>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2 border-t border-[var(--color-danger)]/30 pt-2.5">
        <p className="text-[13px] font-semibold">¿Es el mismo trabajo o uno nuevo?</p>
        <div className="flex flex-col gap-2">
          {/*
            «Ya está registrado» lleva al trabajo que existe, no se limita a
            cerrar el aviso: si de verdad es un duplicado, lo que hace falta
            después es abrir el original —para ponerle una foto, cobrarlo o
            corregirlo—, no quedarse en un formulario que ya no sirve.
          */}
          <Link
            href={duplicados.length === 1 ? `/trabajos/${duplicados[0]!.id}` : '/trabajos'}
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
          >
            {duplicados.length === 1 ? 'Ya está registrado — abrir el existente' : 'Ya están registrados — ir a Trabajos'}
          </Link>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/*
              Guardar queda como acción secundaria. El aviso aparece porque lo
              más probable es que sí sea un duplicado, y destacar «guardar»
              invitaría a pulsarlo sin leer.
            */}
            <button
              type="submit"
              name="confirmado"
              value="1"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold"
            >
              Es otro trabajo — guardar
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-semibold text-[var(--color-muted)]"
            >
              Corregir los datos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
