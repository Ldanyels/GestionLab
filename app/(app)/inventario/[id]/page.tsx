import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requirePermiso } from '@/lib/auth'
import { puede, veMontos } from '@/lib/permisos'
import { getProducto } from '@/lib/inventario/data'
import { ETIQUETA_MOV } from '@/lib/inventario/types'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { MovimientoForm } from '@/components/inventario/MovimientoForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  eliminarProductoAction,
  eliminarMovimientoAction,
  archivarProductoAction,
} from '../actions'

const enlace = 'text-[13.5px] font-semibold text-[var(--color-accent)]'

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const perfil = await requirePermiso('inventario_ver')
  const montos = veMontos(perfil)
  const puedeEditar = puede(perfil, 'inventario_editar')
  const esAdmin = perfil.rol === 'admin'
  const { id } = await params
  const p = await getProducto(id)
  if (!p) notFound()
  const bajo = p.stock_actual <= p.stock_minimo

  return (
    <section className="space-y-4">
      <Link href="/inventario" className="inline-block text-[13.5px] text-[var(--color-muted)]">
        ‹ Inventario
      </Link>

      <Card tono="destacada" className="space-y-3.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="titulo-balance text-2xl font-bold leading-tight">{p.nombre}</h1>
            <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">
              {montos ? `${formatMoney(p.costo_unitario)} / ${p.unidad} · ` : ''}
              mínimo {p.stock_minimo} {p.unidad}
            </p>
          </div>
          {!p.activo ? <Chip tono="neutro">Archivado</Chip> : null}
        </div>

        <div className="rounded-[14px] bg-[var(--color-surface-2)] p-4 text-center">
          <p className="text-[12.5px] text-[var(--color-muted)]">Stock actual</p>
          <p
            className={`num text-[34px] font-bold leading-none ${
              bajo ? 'text-[var(--color-danger)]' : ''
            }`}
          >
            {p.stock_actual} {p.unidad}
          </p>
          {bajo ? (
            <p className="mt-1 text-[13px] text-[var(--color-danger)]">
              Por debajo del mínimo
            </p>
          ) : null}
        </div>

        {esAdmin ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--color-border)] pt-3">
            <Link href={`/inventario/${p.id}/editar`} className={enlace}>
              Editar
            </Link>
            <form action={archivarProductoAction}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="activo" value={p.activo ? 'false' : 'true'} />
              <button type="submit" className={enlace}>
                {p.activo ? 'Archivar' : 'Reactivar'}
              </button>
            </form>
            <span className="ml-auto">
              <ConfirmDialog
                action={eliminarProductoAction}
                fields={{ id: p.id }}
                triggerLabel="Eliminar definitivo"
                triggerClassName="text-[13.5px] font-semibold text-[var(--color-danger)]"
                title="Eliminar definitivo"
                message={`Esto borra «${p.nombre}» y todo su historial de movimientos. No se puede deshacer.`}
                confirmLabel="Sí, eliminar"
              />
            </span>
          </div>
        ) : null}
      </Card>

      {puedeEditar ? (
        <div className="space-y-2.5">
          <h2 className="text-[17px] font-bold">Registrar movimiento</h2>
          <MovimientoForm productoId={p.id} montos={montos} />
        </div>
      ) : null}

      <div className="space-y-2.5">
        <h2 className="text-[17px] font-bold">Historial</h2>
        {p.movimientos.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Sin movimientos aún.</p>
        ) : (
          <Card>
            <ul>
              {p.movimientos.map((m, i) => (
                <li
                  key={m.id}
                  className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}
                >
                  <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="font-semibold">
                        {ETIQUETA_MOV[m.tipo]}{' '}
                        <span
                          className={`num ${
                            m.cantidad >= 0
                              ? 'text-[var(--color-success)]'
                              : 'text-[var(--color-danger)]'
                          }`}
                        >
                          {m.cantidad >= 0 ? '+' : ''}
                          {m.cantidad} {p.unidad}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-[var(--color-muted)]">
                        {m.fecha}
                        {m.motivo ? ` · ${m.motivo}` : ''}
                        {montos && m.costo_unitario != null
                          ? ` · ${formatMoney(m.costo_unitario)}/${p.unidad}`
                          : ''}
                        {m.trabajo_id ? ' · por trabajo' : ''}
                      </span>
                    </span>
                    {puedeEditar ? (
                      <ConfirmDialog
                        action={eliminarMovimientoAction}
                        fields={{ id: m.id, producto_id: p.id }}
                        triggerLabel="Eliminar"
                        triggerClassName="shrink-0 text-[13px] font-semibold text-[var(--color-danger)]"
                        title="Eliminar movimiento"
                        message="Se borra este movimiento y el stock se ajusta."
                        confirmLabel="Sí, eliminar"
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </section>
  )
}
