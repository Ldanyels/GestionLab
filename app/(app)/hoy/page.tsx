import Link from 'next/link'
import { getSessionPerfil } from '@/lib/auth'
import { puede } from '@/lib/permisos'
import { listProductos } from '@/lib/inventario/data'
import { datosHoy } from '@/lib/hoy/data'
import { fechaLarga } from '@/lib/trabajos/agenda'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { KpiTile } from '@/components/ui/KpiTile'
import { TarjetaEntrega } from '@/components/hoy/TarjetaEntrega'
import { TarjetaMovimiento } from '@/components/hoy/TarjetaMovimiento'

export default async function HoyPage() {
  const perfil = await getSessionPerfil()
  const veInventario = puede(perfil, 'inventario_ver')
  const [datos, productos] = await Promise.all([
    datosHoy(perfil),
    veInventario ? listProductos() : Promise.resolve([]),
  ])
  const stockBajo = productos.filter((p) => p.stock_actual <= p.stock_minimo)

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
          {fechaLarga(datos.hoy)}
        </p>
        <h1 className="text-[30px] font-bold leading-tight tracking-[-0.03em]">Hoy</h1>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
        {/* "Trabajos de hoy" y no "Entregas de hoy": la fecha de entrega llega
            vacía en todos los trabajos, así que ese contador marcaba siempre 0.
            Este cuenta lo que ingresó hoy y coincide con la lista de abajo. */}
        <KpiTile etiqueta="Trabajos de hoy" valor={String(datos.resumen.ingresadosHoy)} />
        <KpiTile etiqueta="En curso" valor={String(datos.resumen.enCurso)} />
        {/*
          El mosaico de atrasadas solo aparece cuando hay alguna. Un «0» fijo en
          rojo se vuelve parte del decorado y deja de leerse el día que dice 3.
        */}
        {datos.resumen.atrasadas > 0 ? (
          <KpiTile
            etiqueta="Atrasadas"
            valor={String(datos.resumen.atrasadas)}
            tono="peligro"
          />
        ) : null}
        {datos.montos ? (
          <KpiTile
            etiqueta="Por cobrar"
            valor={formatMoney(datos.resumen.porCobrar)}
            tono="peligro"
            // En móvil ocupa la fila completa: un importe grande no cabe a media pantalla.
            className="col-span-full sm:col-span-1"
          />
        ) : null}
      </div>

      {veInventario && stockBajo.length > 0 ? (
        <Link
          href="/inventario"
          className="block rounded-[var(--radius-lg)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm"
        >
          {stockBajo.length} insumo{stockBajo.length === 1 ? '' : 's'} en stock bajo — toca
          para revisar.
        </Link>
      ) : null}

      <Link
        href="/trabajos/nuevo"
        className="flex h-14 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-accent)] text-[16.5px] font-semibold text-[var(--color-accent-contrast)] shadow-[0_6px_18px_var(--color-accent-glow)] transition-transform active:scale-[0.99]"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nuevo trabajo
      </Link>

      {/*
        Las atrasadas van **antes** que el trabajo del día.

        Es la única sección de la pantalla que pide una acción concreta: llamar
        al consultorio o terminar el trabajo. Ponerla debajo de la lista del día
        la dejaría fuera de la primera pantalla del teléfono, que es donde de
        verdad se lee.
      */}
      {datos.atrasados.length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-bold text-[var(--color-danger)]">
              Atrasadas
            </h2>
            <span className="num shrink-0 text-[13.5px] text-[var(--color-muted)]">
              la más vieja primero
            </span>
          </div>
          <ul className="space-y-2.5">
            {datos.atrasados.map((t) => (
              <li key={t.id}>
                <TarjetaEntrega trabajo={t} montos={datos.montos} conEstado hoy={datos.hoy} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/*
        Todo lo que se movió hoy, venga del día que venga.

        Sustituye a la lista de «lo que ingresó hoy»: un trabajo que entró la
        semana pasada y se terminó esta mañana también es producción de hoy, y
        antes no aparecía en ninguna parte. Cada trabajo sale una sola vez, con
        todas las etiquetas de lo que le pasó.
      */}
      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[17px] font-bold">Movimientos de hoy</h2>
          <Link
            href="/trabajos"
            className="shrink-0 text-[13.5px] font-semibold text-[var(--color-accent)]"
          >
            Ver todos →
          </Link>
        </div>

        {datos.movimientos.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
            <p className="text-[15px] font-semibold">Todavía no hay movimientos hoy</p>
            <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
              Aquí aparece lo que ingrese, se cierre, se entregue o se cobre durante el día.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {datos.movimientos.map((m) => (
              <li key={m.id}>
                <TarjetaMovimiento
                  trabajo={m}
                  movimientos={m.movimientos}
                  cobradoHoy={m.cobrado_hoy}
                  montos={datos.montos}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/*
        Lo que hay que sacar hoy: prometido para hoy y todavía abierto.

        No se solapa con los movimientos: aquello dice qué **pasó**, esto dice
        qué **falta**. Un trabajo prometido para hoy que nadie ha tocado no
        tiene ningún movimiento, y es justo el que hay que ver.
      */}
      {datos.entregas.length > 0 ? (
        <div className="space-y-2.5">
          <h2 className="text-[17px] font-bold">Entregas pendientes de hoy</h2>
          <ul className="space-y-2.5">
            {datos.entregas.map((t) => (
              <li key={t.id}>
                <TarjetaEntrega trabajo={t} montos={datos.montos} hoy={datos.hoy} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {datos.montos && datos.deuda.length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-bold">A quién cobrar</h2>
            <Link
              href="/consultorios/cuentas"
              className="shrink-0 text-[13.5px] font-semibold text-[var(--color-accent)]"
            >
              Estado de cuenta →
            </Link>
          </div>
          <Card>
            <ul>
              {datos.deuda.map((d, i) => (
                <li
                  key={d.id}
                  className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}
                >
                  <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: colorConsultorio(d.nombre) }}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold">
                          {d.nombre}
                        </span>
                        <span className="block truncate text-[12.5px] text-[var(--color-muted)]">
                          {d.detalle}
                        </span>
                      </span>
                    </span>
                    <span className="num shrink-0 text-[15px] font-bold text-[var(--color-danger)]">
                      {formatMoney(d.saldo)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </section>
  )
}
