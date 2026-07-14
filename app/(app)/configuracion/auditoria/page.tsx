import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import {
  listAuditoria,
  etiquetaTabla,
  etiquetaAccion,
} from '@/lib/auditoria/data'

const colorAccion: Record<string, string> = {
  INSERT: 'text-[var(--color-success)]',
  UPDATE: 'text-[var(--color-accent)]',
  DELETE: 'text-[var(--color-danger)]',
}

export default async function AuditoriaPage() {
  await requireAdmin()
  const eventos = await listAuditoria(150)

  return (
    <section className="space-y-4">
      <div>
        <Link href="/configuracion" className="text-sm text-[var(--color-muted)]">
          ‹ Configuración
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Historial de actividad</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Quién creó, actualizó o eliminó registros (últimos 150).
        </p>
      </div>

      {eventos.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          Aún no hay actividad registrada.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {eventos.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate">
                <span className="font-medium">{e.usuario_nombre ?? 'Sistema'}</span>{' '}
                <span className={colorAccion[e.accion]}>
                  {etiquetaAccion(e.accion).toLowerCase()}
                </span>{' '}
                {etiquetaTabla(e.tabla)}
              </span>
              <span className="shrink-0 text-xs text-[var(--color-muted)]">
                {new Date(e.creado_en).toLocaleString('es-PE', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
