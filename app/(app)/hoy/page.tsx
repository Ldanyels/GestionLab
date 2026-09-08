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
        <KpiTile etiqueta="Entregas de hoy" valor={String(datos.resumen.entregasHoy)} />
        <KpiTile etiqueta="En curso" valor={String(datos.resumen.enCurso)} />
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

      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[17px] font-bold">Agenda de entregas</h2>
          <Link
            href="/trabajos"
            className="shrink-0 text-[13.5px] font-semibold text-[var(--color-accent)]"
          >
            Ver todos →
          </Link>
        </div>

        {datos.entregas.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
            <p className="text-[15px] font-semibold">Sin entregas para hoy</p>
            <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
              Los trabajos con otra fecha están en Trabajos.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {datos.entregas.map((t) => (
              <li key={t.id}>
                <Link href={`/trabajos/${t.id}`} className="block">
                  <Card
                    tono="lista"
                    colorLateral={colorConsultorio(t.consultorio_nombre)}
                    className="px-3.5 py-3 transition-transform hover:-translate-y-px"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="titulo-balance text-[15.5px] font-semibold">
                          {t.tipo_nombre}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-[var(--color-muted)]">
                          {t.consultorio_nombre} · {t.doctor_nombre}
                          {t.paciente_nombre ? ` · ${t.paciente_nombre}` : ''}
                        </p>
                      </div>
                      {datos.montos ? (
                        <span className="num shrink-0 text-sm font-semibold">
                          {formatMoney(t.precio_acordado)}
                        </span>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

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
