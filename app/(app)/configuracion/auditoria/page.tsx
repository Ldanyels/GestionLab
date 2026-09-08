import { requireAdmin } from '@/lib/auth'
import { listAuditoria, etiquetaTabla, etiquetaAccion } from '@/lib/auditoria/data'
import { BackRow } from '@/components/ui/BackRow'
import { Card } from '@/components/ui/Card'

const colorAccion: Record<string, string> = {
  INSERT: 'text-[var(--color-success)]',
  UPDATE: 'text-[var(--color-accent)]',
  DELETE: 'text-[var(--color-danger)]',
}

export default async function AuditoriaPage() {
  await requireAdmin()
  const eventos = await listAuditoria(150)

  return (
    <section className="mx-auto max-w-[620px] space-y-4">
      <BackRow
        href="/configuracion"
        titulo="Historial de actividad"
        migaDePan="Configuración"
      />
      <p className="text-[13.5px] text-[var(--color-muted)]">
        Quién creó, actualizó o eliminó registros (últimos 150).
      </p>

      {eventos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">Sin actividad</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            Aquí aparecerá lo que haga el equipo.
          </p>
        </div>
      ) : (
        <Card>
          <ul>
            {eventos.map((e, i) => (
              <li key={e.id} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                <div className="flex items-baseline justify-between gap-3 px-3.5 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm">
                      <span className="font-semibold">
                        {e.usuario_nombre ?? 'Sistema'}
                      </span>{' '}
                      <span className={`font-normal ${colorAccion[e.accion] ?? ''}`}>
                        {etiquetaAccion(e.accion).toLowerCase()}
                      </span>
                    </span>
                    <span className="block truncate text-[12.5px] text-[var(--color-muted)]">
                      {etiquetaTabla(e.tabla)}
                    </span>
                  </span>
                  <span className="num shrink-0 text-[12.5px] text-[var(--color-muted)]">
                    {new Date(e.creado_en).toLocaleString('es-PE', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  )
}
