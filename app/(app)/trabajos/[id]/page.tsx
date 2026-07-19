import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTrabajo } from '@/lib/trabajos/data'
import { getSessionPerfil } from '@/lib/auth'
import { costoInsumosPorTrabajo } from '@/lib/inventario/data'
import { progresoTrabajo } from '@/lib/trabajos/estado'
import { formatMoney } from '@/lib/format'
import { EstadoBadge } from '@/components/trabajos/EstadoBadge'
import { EtapaAcciones } from '@/components/trabajos/EtapaAcciones'
import { PagosSection } from '@/components/trabajos/PagosSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  cambiarEstadoTrabajoAction,
  eliminarTrabajoAction,
} from '../actions'

export default async function TrabajoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [t, perfil] = await Promise.all([getTrabajo(id), getSessionPerfil()])
  if (!t) notFound()

  const progreso = progresoTrabajo(t.etapas)
  const esAdmin = perfil?.rol === 'admin'
  const costoInsumos = esAdmin ? await costoInsumosPorTrabajo(t.id) : 0
  const margen = Math.round((t.precio_acordado - costoInsumos) * 100) / 100

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href="/trabajos" className="text-sm text-[var(--color-muted)]">
            ‹ Trabajos
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {t.tipo_nombre}
            </h1>
            <EstadoBadge estado={t.estado} />
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            <Link
              href={`/doctores/${t.doctor_id}`}
              className="text-[var(--color-accent)]"
            >
              {t.doctor_nombre}
            </Link>{' '}
            · {t.consultorio_nombre}
            {t.paciente_nombre ? ` · ${t.paciente_nombre}` : ''}
            {t.pieza ? ` · pza ${t.pieza}` : ''}
          </p>
          <Link
            href={`/trabajos/nuevo?doctor=${t.doctor_id}`}
            className="text-sm font-medium text-[var(--color-accent)]"
          >
            + Otro trabajo para {t.doctor_nombre}
          </Link>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/trabajos/${t.id}/editar`}
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
          >
            Editar
          </Link>
          <ConfirmDialog
            action={eliminarTrabajoAction}
            fields={{ id: t.id }}
            triggerLabel="Eliminar"
            triggerClassName="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm text-[var(--color-danger)]"
            title="Eliminar trabajo"
            message="¿Eliminar este trabajo y sus etapas? Esta acción no se puede deshacer."
          />
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
          <p className="text-[var(--color-muted)]">Precio acordado</p>
          <p className="num text-lg font-semibold">
            {formatMoney(t.precio_acordado)}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
          <p className="text-[var(--color-muted)]">Ingreso</p>
          <p className="font-medium">{t.fecha_ingreso}</p>
          {t.fecha_entrega ? (
            <p className="text-xs text-[var(--color-muted)]">Entrega: {t.fecha_entrega}</p>
          ) : null}
        </div>
      </div>

      {t.notas ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
          {t.notas}
        </p>
      ) : null}

      {esAdmin ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm">
          <p className="font-medium">Costeo del trabajo</p>
          <div className="mt-1 grid grid-cols-3 gap-2 text-center">
            <span>
              <span className="block text-xs text-[var(--color-muted)]">Precio</span>
              <span className="num">{formatMoney(t.precio_acordado)}</span>
            </span>
            <span>
              <span className="block text-xs text-[var(--color-muted)]">Insumos</span>
              <span className="num">{formatMoney(costoInsumos)}</span>
            </span>
            <span>
              <span className="block text-xs text-[var(--color-muted)]">Margen</span>
              <span
                className={`num ${margen >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}
              >
                {formatMoney(margen)}
              </span>
            </span>
          </div>
          {costoInsumos === 0 ? (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              El costo de insumos se calcula al cerrar el trabajo (según su receta).
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Estado del trabajo */}
      <div className="flex flex-wrap gap-2">
        {t.estado !== 'cerrado' ? (
          <EstadoBtn id={t.id} estado="cerrado" label="Cerrar trabajo" />
        ) : null}
        {t.estado !== 'entregado' ? (
          <EstadoBtn id={t.id} estado="entregado" label="Marcar entregado" />
        ) : null}
        {t.estado !== 'en_curso' ? (
          <EstadoBtn id={t.id} estado="en_curso" label="Reabrir" ghost />
        ) : null}
      </div>

      {/* Etapas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Etapas</h2>
          <span className="text-sm text-[var(--color-muted)]">{progreso}% completado</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-accent)] transition-all"
            style={{ width: `${progreso}%` }}
          />
        </div>
        {t.etapas.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Este tipo de trabajo no tenía etapas en su plantilla.
          </p>
        ) : (
          <ul className="space-y-2">
            {t.etapas.map((e) => (
              <EtapaAcciones key={e.id} etapa={e} />
            ))}
          </ul>
        )}
      </div>

      <PagosSection trabajoId={t.id} precio={t.precio_acordado} />
    </section>
  )
}

function EstadoBtn({
  id,
  estado,
  label,
  ghost,
}: {
  id: string
  estado: string
  label: string
  ghost?: boolean
}) {
  return (
    <form action={cambiarEstadoTrabajoAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button
        type="submit"
        className={`h-10 rounded-[var(--radius-md)] px-4 text-sm font-medium ${
          ghost
            ? 'border border-[var(--color-border)] text-[var(--color-text)]'
            : 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
        }`}
      >
        {label}
      </button>
    </form>
  )
}
