import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getTrabajador } from '@/lib/trabajadores/data'
import { listCatalogo } from '@/lib/catalogo/data'
import { formatMoney } from '@/lib/format'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MontoEstandarEditor } from '@/components/trabajadores/MontoEstandarEditor'
import { PagoTrabajadorForm } from '@/components/trabajadores/PagoTrabajadorForm'
import { TrabajadorForm } from '@/components/trabajadores/TrabajadorForm'
import {
  editarTrabajadorAction,
  eliminarTrabajadorAction,
  eliminarPagoTrabajadorAction,
} from '../actions'

export default async function TrabajadorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const [t, tipos] = await Promise.all([getTrabajador(id), listCatalogo()])
  if (!t) notFound()

  return (
    <section className="space-y-6">
      <div>
        <Link href="/configuracion/trabajadores" className="text-sm text-[var(--color-muted)]">
          ‹ Trabajadores
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">{t.nombre}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Total pagado: {formatMoney(t.total_pagado)}
        </p>
      </div>

      <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
        <summary className="cursor-pointer text-sm font-medium">Editar / eliminar</summary>
        <div className="mt-3 space-y-3">
          <TrabajadorForm
            action={editarTrabajadorAction}
            trabajador={t}
            submitLabel="Guardar cambios"
          />
          <ConfirmDialog
            action={eliminarTrabajadorAction}
            fields={{ id: t.id }}
            triggerLabel="Eliminar trabajador"
            triggerClassName="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-danger)]"
            title="Eliminar trabajador"
            message={`¿Eliminar a "${t.nombre}" y todos sus pagos registrados?`}
          />
        </div>
      </details>

      <MontoEstandarEditor
        trabajadorId={t.id}
        montos={t.montos}
        tipos={tipos.map((c) => ({ id: c.id, nombre: c.nombre }))}
      />

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Registrar pago</h2>
        <PagoTrabajadorForm trabajadorId={t.id} montos={t.montos} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Historial de pagos</h2>
        {t.pagos.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Sin pagos aún.</p>
        ) : (
          <ul className="space-y-2">
            {t.pagos.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium tabular-nums">{formatMoney(p.monto)}</span>
                  <span className="block text-xs text-[var(--color-muted)]">
                    {p.fecha}
                    {p.nota ? ` · ${p.nota}` : ''}
                  </span>
                </span>
                <ConfirmDialog
                  action={eliminarPagoTrabajadorAction}
                  fields={{ id: p.id, trabajador_id: t.id }}
                  triggerLabel="Eliminar"
                  triggerClassName="shrink-0 text-[var(--color-danger)]"
                  title="Eliminar pago"
                  message={`¿Eliminar el pago de ${formatMoney(p.monto)}?`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
