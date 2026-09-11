import Link from 'next/link'
import { BackRow } from '@/components/ui/BackRow'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { requireAdmin } from '@/lib/auth'
import { gastosDelPeriodo } from '@/lib/gastos/data'
import { ETIQUETA_CATEGORIA } from '@/lib/gastos/categorias'
import { resumenDeGastos } from '@/lib/gastos/resumen'
import { rangoMesActual } from '@/lib/finanzas/mes'
import { hoyLima } from '@/lib/trabajos/agenda'
import { formatMoney } from '@/lib/format'
import { GastoForm } from '@/components/gastos/GastoForm'
import { crearGastoAction, eliminarGastoAction } from './actions'

/**
 * Gastos del mes: registrarlos y verlos.
 *
 * Vive bajo Finanzas y no en Configuración porque no es un ajuste: es un
 * movimiento de dinero que se registra tan seguido como los pagos.
 */
export default async function GastosPage() {
  await requireAdmin()
  const { desde, hasta } = rangoMesActual()
  const gastos = await gastosDelPeriodo(desde, hasta)
  const resumen = resumenDeGastos(gastos)

  return (
    <section className="space-y-4">
      <BackRow href="/finanzas" titulo="Gastos del mes" />

      <Card className="space-y-3 p-3.5">
        <h2 className="text-base font-bold">Registrar un gasto</h2>
        <GastoForm hoy={hoyLima()} action={crearGastoAction} />
      </Card>

      {gastos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">Sin gastos este mes</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            Mientras la luz, el agua o el alquiler no estén aquí, la utilidad que ves en
            Finanzas es más alta que la real.
          </p>
        </div>
      ) : (
        <>
          <Card className="p-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-bold">Total del mes</h2>
              <span className="num text-[19px] font-bold">{formatMoney(resumen.total)}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              {resumen.detalle.map((l) => (
                <div
                  key={`${l.categoria}-${l.concepto}`}
                  className="flex justify-between gap-3"
                >
                  <span className="min-w-0 truncate text-[var(--color-muted)]">
                    {l.concepto}
                    {l.veces > 1 ? ` ×${l.veces}` : ''}
                    <span className="text-[11px] uppercase tracking-[0.06em]">
                      {' '}
                      · {ETIQUETA_CATEGORIA[l.categoria]}
                    </span>
                  </span>
                  <span className="num shrink-0 font-semibold">{formatMoney(l.monto)}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-2">
            <h2 className="text-base font-bold">Uno por uno</h2>
            <ul className="space-y-2">
              {gastos.map((g) => (
                <li key={g.id}>
                  <Card tono="lista" className="flex items-start justify-between gap-3 p-3">
                    <span className="min-w-0">
                      <span className="block truncate text-[14.5px] font-semibold">
                        {g.concepto}
                      </span>
                      <span className="block text-[12.5px] text-[var(--color-muted)]">
                        {ETIQUETA_CATEGORIA[g.categoria]} · {g.fecha}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="num text-[14.5px] font-bold">
                        {formatMoney(g.monto)}
                      </span>
                      <ConfirmDialog
                        action={eliminarGastoAction}
                        fields={{ id: g.id }}
                        triggerLabel="Eliminar"
                        triggerClassName="text-[12.5px] font-semibold text-[var(--color-danger)]"
                        title="Eliminar gasto"
                        message={`Se borra «${g.concepto}» de ${formatMoney(g.monto)} y la utilidad del mes vuelve a subir.`}
                        confirmLabel="Sí, eliminar"
                      />
                    </span>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <Link href="/finanzas" className="inline-block text-[13.5px] text-[var(--color-accent)]">
        ‹ Volver a Finanzas
      </Link>
    </section>
  )
}
