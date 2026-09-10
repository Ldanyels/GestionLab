import { Card } from '@/components/ui/Card'
import {
  descripcionFiscal,
  tieneDatosFacturacion,
  type FacturacionGuardada,
} from '@/lib/facturacion/documento'

const campo =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'
const etiqueta =
  'block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]'

/**
 * Datos de facturación del laboratorio, con su formulario de corrección.
 *
 * Se muestra siempre, también cuando faltan: los laboratorios dados de alta
 * antes de que existieran estos campos no los tienen, y sin verlo en la ficha
 * no habría forma de saber a quién no se le puede emitir un comprobante.
 */
export function FacturacionLaboratorio({
  labId,
  datos,
  accion,
}: {
  labId: string
  datos: FacturacionGuardada
  accion: (formData: FormData) => Promise<void>
}) {
  const completos = tieneDatosFacturacion(datos)

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-bold tracking-[-0.01em]">Facturación</h2>
        <span
          className={`text-[13px] ${
            completos ? 'text-[var(--color-muted)]' : 'font-semibold text-[var(--color-danger)]'
          }`}
        >
          {descripcionFiscal(datos)}
        </span>
      </div>

      <Card tono="lista" className="p-3.5">
        <form action={accion} className="space-y-3">
          <input type="hidden" name="laboratorio_id" value={labId} />

          <div className="grid grid-cols-[130px_1fr] gap-2">
            <label className="space-y-1">
              <span className={etiqueta}>Documento</span>
              <select
                name="doc_tipo"
                defaultValue={(datos.doc_tipo as string) ?? 'RUC'}
                className={campo}
              >
                <option value="RUC">RUC</option>
                <option value="DNI">DNI</option>
                <option value="CE">C. extranjería</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className={etiqueta}>Número</span>
              <input
                name="doc_numero"
                type="text"
                inputMode="numeric"
                maxLength={20}
                defaultValue={datos.doc_numero ?? ''}
                required
                className={campo}
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className={etiqueta}>Nombre o razón social</span>
            <input
              name="razon_social"
              type="text"
              maxLength={200}
              defaultValue={datos.razon_social ?? ''}
              required
              className={campo}
            />
          </label>

          <label className="block space-y-1">
            <span className={etiqueta}>Dirección fiscal (opcional)</span>
            <input
              name="direccion_fiscal"
              type="text"
              maxLength={200}
              defaultValue={datos.direccion_fiscal ?? ''}
              className={campo}
            />
          </label>

          <button
            type="submit"
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-semibold"
          >
            Guardar datos de facturación
          </button>
        </form>
      </Card>
    </section>
  )
}
