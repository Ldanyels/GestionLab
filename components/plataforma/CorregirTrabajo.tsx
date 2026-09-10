import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { formatMoney } from '@/lib/format'
import { ETIQUETA_TRABAJO } from '@/lib/trabajos/estado'
import type { TrabajoConAbonos } from '@/lib/plataforma/laboratorio-detalle'

const campo =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'
const etiqueta =
  'block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]'

/**
 * Corrección de un trabajo ajeno y de sus abonos.
 *
 * Los campos vienen con el valor actual: quien corrige cambia uno y deja los
 * demás, y la acción descarta los que llegan iguales para no registrar cambios
 * que no ocurrieron.
 *
 * No se puede tocar el doctor, el tipo ni las líneas de la cuenta. Eso no es
 * corregir un error de dedo, es rehacer el trabajo, y le corresponde al
 * laboratorio que sabe qué se hizo de verdad.
 */
export function CorregirTrabajo({
  labId,
  datos,
  corregir,
  borrarAbono,
}: {
  labId: string
  datos: TrabajoConAbonos
  corregir: (formData: FormData) => Promise<void>
  borrarAbono: (formData: FormData) => Promise<void>
}) {
  const { trabajo: t, abonos } = datos

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
          {t.tipo_nombre}
        </h1>
        <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
          {t.consultorio_nombre} · {t.doctor_nombre}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Chip tono="neutro">{ETIQUETA_TRABAJO[t.estado]}</Chip>
          <span className="num text-[13.5px] text-[var(--color-muted)]">
            saldo {formatMoney(t.saldo)}
          </span>
        </div>
      </header>

      <Card tono="lista" className="p-3.5">
        <form action={corregir} className="space-y-3">
          <input type="hidden" name="laboratorio_id" value={labId} />
          <input type="hidden" name="trabajo_id" value={t.id} />

          <label className="block space-y-1">
            <span className={etiqueta}>Precio acordado</span>
            <input
              name="precio_acordado"
              type="number"
              step="0.01"
              min="0"
              defaultValue={t.precio_acordado}
              required
              className={campo}
            />
          </label>

          <label className="block space-y-1">
            <span className={etiqueta}>Estado</span>
            <select name="estado" defaultValue={t.estado} className={campo}>
              <option value="en_curso">En curso</option>
              <option value="cerrado">Cerrado</option>
              <option value="entregado">Entregado</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className={etiqueta}>Fecha de ingreso</span>
              <input
                name="fecha_ingreso"
                type="date"
                defaultValue={t.fecha_ingreso}
                required
                className={campo}
              />
            </label>
            <label className="block space-y-1">
              <span className={etiqueta}>Fecha de entrega</span>
              <input
                name="entregado_el"
                type="date"
                defaultValue={t.entregado_el ?? ''}
                className={campo}
              />
            </label>
          </div>

          <button
            type="submit"
            className="h-11 w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-contrast)]"
          >
            Guardar corrección
          </button>
        </form>
      </Card>

      <section className="space-y-2.5">
        <h2 className="text-[15px] font-bold">Abonos</h2>

        {abonos.length === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-center text-[13.5px] text-[var(--color-muted)]">
            Este trabajo está sin abonos.
          </p>
        ) : (
          <ul className="space-y-2">
            {abonos.map((a) => (
              <li key={a.id}>
                <Card tono="lista" className="flex items-center justify-between gap-3 p-3">
                  <span className="text-[13.5px]">
                    <span className="num font-semibold">{formatMoney(a.monto)}</span>
                    {a.fecha ? (
                      <span className="text-[var(--color-muted)]"> · {a.fecha}</span>
                    ) : null}
                    <span className="text-[var(--color-muted)]"> · {a.metodo}</span>
                  </span>
                  <form action={borrarAbono}>
                    <input type="hidden" name="laboratorio_id" value={labId} />
                    <input type="hidden" name="abono_id" value={a.id} />
                    <input type="hidden" name="trabajo_id" value={t.id} />
                    <button
                      type="submit"
                      className="text-[13px] font-semibold text-[var(--color-danger)]"
                    >
                      Borrar abono
                    </button>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {/*
          No hay forma de añadir abonos, y es deliberado: un pago que la
          plataforma inventara sería peor que el error que viene a arreglar.
          Quien sabe cuánto pagó de verdad ese consultorio es el laboratorio.
        */}
        <p className="text-[12.5px] text-[var(--color-muted)]">
          Desde aquí solo se pueden borrar. Volver a registrar el pago correcto le toca al
          laboratorio.
        </p>
      </section>
    </div>
  )
}
