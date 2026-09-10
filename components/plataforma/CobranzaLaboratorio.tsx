import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { formatMoney } from '@/lib/format'
import { diasDeMora, ETIQUETA_PERIODICIDAD, PERIODICIDADES } from '@/lib/cuotas/periodos'
import type { Cuota } from '@/lib/cuotas/data'
import type { LaboratorioFila } from '@/lib/plataforma/laboratorios'

const campo =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'
const etiqueta =
  'block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]'

/**
 * Cobranza de un laboratorio: sus condiciones y sus cuotas.
 *
 * Marcar pagada pide fecha, medio y número de comprobante. Los tres, porque una
 * cuota marcada como pagada sin decir cuándo ni con qué no sirve para cuadrar
 * caja al final del mes, que es para lo que existe este registro.
 *
 * No hay suspensión automática, y es una decisión: el estado de pago se ingresa
 * a mano, y automatizar el corte encima de un dato manual es cómo se le corta
 * el acceso a un cliente que sí pagó. La mora se muestra; suspender sigue
 * siendo un clic deliberado en la lista de laboratorios.
 */
export function CobranzaLaboratorio({
  lab,
  cuotas,
  hoy,
  guardarCondiciones,
  marcarPagada,
  anular,
}: {
  lab: LaboratorioFila
  cuotas: readonly Cuota[]
  hoy: string
  guardarCondiciones: (formData: FormData) => Promise<void>
  marcarPagada: (formData: FormData) => Promise<void>
  anular: (formData: FormData) => Promise<void>
}) {
  const cortesia = lab.plan === 'gratis'

  return (
    <section className="space-y-3">
      <h2 className="text-[17px] font-bold tracking-[-0.01em]">Cobranza</h2>

      <Card tono="lista" className="p-3.5">
        <form action={guardarCondiciones} className="space-y-3">
          <input type="hidden" name="laboratorio_id" value={lab.id} />

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className={etiqueta}>Plan</span>
              <select
                name="plan"
                defaultValue={lab.plan}
                aria-label="Plan"
                className={campo}
              >
                <option value="pagado">De pago</option>
                <option value="gratis">Cortesía</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className={etiqueta}>Periodicidad</span>
              <select
                name="periodicidad"
                defaultValue={lab.periodicidad ?? 'mensual'}
                aria-label="Periodicidad"
                className={campo}
              >
                {PERIODICIDADES.map((p) => (
                  <option key={p} value={p}>
                    {ETIQUETA_PERIODICIDAD[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={etiqueta}>Precio</span>
              <input
                name="precio_cuota"
                type="number"
                step="0.01"
                min="0"
                defaultValue={lab.precio_cuota ?? 250}
                aria-label="Precio"
                className={campo}
              />
            </label>
            <label className="space-y-1">
              <span className={etiqueta}>Inicio de cobro</span>
              <input
                name="inicio_cobro"
                type="date"
                defaultValue={lab.inicio_cobro ?? ''}
                aria-label="Inicio de cobro"
                className={campo}
              />
            </label>
          </div>

          {cortesia ? (
            <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
              Este laboratorio está en <strong className="font-semibold">cortesía</strong>: no
              se le genera ninguna cuota. Cámbialo a «De pago» y pon la fecha de inicio para
              empezar a cobrarle.
            </p>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
              Las cuotas se generan solas desde la fecha de inicio, una por periodo, al abrir
              el panel. No se emiten periodos que aún no han empezado.
            </p>
          )}

          <button
            type="submit"
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-semibold"
          >
            Guardar condiciones
          </button>
        </form>
      </Card>

      {cuotas.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-center text-[13.5px] text-[var(--color-muted)]">
          Sin cuotas emitidas.
        </p>
      ) : (
        <ul className="space-y-2">
          {cuotas.map((c) => {
            const mora = c.estado === 'pendiente' ? diasDeMora(c.vence_el, hoy) : 0
            return (
              <li key={c.id}>
                <Card tono="lista" className="space-y-2.5 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="num block text-[15px] font-bold">
                        {formatMoney(c.monto)}
                      </span>
                      <span className="num block text-[12.5px] text-[var(--color-muted)]">
                        {c.periodo_inicio} → {c.periodo_fin}
                      </span>
                      {c.estado === 'pagada' ? (
                        <span className="block text-[12.5px] text-[var(--color-success)]">
                          Pagada el {c.pagada_el}
                          {c.medio_pago ? ` · ${c.medio_pago}` : ''}
                          {c.comprobante ? ` · ${c.comprobante}` : ''}
                        </span>
                      ) : null}
                      {c.estado === 'anulada' ? (
                        <span className="block text-[12.5px] text-[var(--color-muted)]">
                          Anulada{c.nota ? ` · ${c.nota}` : ''}
                        </span>
                      ) : null}
                    </span>

                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {c.estado === 'pagada' ? <Chip tono="exito">Pagada</Chip> : null}
                      {c.estado === 'anulada' ? <Chip tono="neutro">Anulada</Chip> : null}
                      {mora > 0 ? (
                        <Chip tono="peligro">
                          {mora} {mora === 1 ? 'día' : 'días'} de mora
                        </Chip>
                      ) : c.estado === 'pendiente' ? (
                        <Chip tono="neutro">Vence {c.vence_el}</Chip>
                      ) : null}
                    </span>
                  </div>

                  {c.estado === 'pendiente' ? (
                    <div className="space-y-2 border-t border-[var(--color-border)] pt-2.5">
                      <form action={marcarPagada} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="cuota_id" value={c.id} />
                        <input type="hidden" name="laboratorio_id" value={lab.id} />
                        <label className="space-y-1">
                          <span className={etiqueta}>Pagada el</span>
                          <input
                            name="pagada_el"
                            type="date"
                            defaultValue={hoy}
                            required
                            className={`${campo} w-[150px]`}
                          />
                        </label>
                        <label className="space-y-1">
                          <span className={etiqueta}>Medio</span>
                          <select
                            name="medio_pago"
                            defaultValue="yape/plin"
                            className={`${campo} w-[130px]`}
                          >
                            <option value="yape/plin">yape/plin</option>
                            <option value="transferencia">transferencia</option>
                            <option value="efectivo">efectivo</option>
                            <option value="otro">otro</option>
                          </select>
                        </label>
                        <label className="space-y-1">
                          <span className={etiqueta}>N.º de boleta</span>
                          <input
                            name="comprobante"
                            type="text"
                            maxLength={40}
                            className={`${campo} w-[140px]`}
                          />
                        </label>
                        <button
                          type="submit"
                          className="h-11 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
                        >
                          Marcar pagada
                        </button>
                      </form>

                      <form action={anular} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="cuota_id" value={c.id} />
                        <input type="hidden" name="laboratorio_id" value={lab.id} />
                        <label className="flex-1 space-y-1">
                          <span className={etiqueta}>Anular, porque…</span>
                          <input
                            name="nota"
                            type="text"
                            maxLength={200}
                            placeholder="duplicada, emitida por error…"
                            required
                            className={campo}
                          />
                        </label>
                        <button
                          type="submit"
                          className="h-11 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-[13px] font-semibold text-[var(--color-danger)]"
                        >
                          Anular
                        </button>
                      </form>
                    </div>
                  ) : null}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
