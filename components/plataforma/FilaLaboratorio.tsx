import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { cambiarEstadoAction } from '@/app/(plataforma)/plataforma/actions'
import type { LaboratorioFila } from '@/lib/plataforma/laboratorios'

/** Un laboratorio en la lista de la plataforma, con su acción de estado. */
export function FilaLaboratorio({ lab }: { lab: LaboratorioFila }) {
  const activo = lab.estado === 'activo'
  // El destino es el contrario del estado actual: si fuera fijo, el botón de
  // reactivar volvería a suspender.
  const destino = activo ? 'suspendido' : 'activo'

  return (
    <Card tono="lista" className="space-y-3 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15.5px] font-semibold">{lab.nombre}</p>
          <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">
            {lab.usuarios} {lab.usuarios === 1 ? 'usuario' : 'usuarios'} · {lab.trabajos}{' '}
            {lab.trabajos === 1 ? 'trabajo' : 'trabajos'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {activo ? null : <Chip tono="peligro">Suspendido</Chip>}
          <Chip tono={lab.plan === 'pagado' ? 'exito' : 'neutro'}>
            {lab.plan === 'pagado' ? 'Pagado' : 'Cortesía'}
          </Chip>
        </div>
      </div>

      <form action={cambiarEstadoAction} className="border-t border-[var(--color-border)] pt-3">
        <input type="hidden" name="id" value={lab.id} />
        <input type="hidden" name="estado" value={destino} />
        <button
          type="submit"
          className={`text-[13px] font-semibold ${
            activo ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'
          }`}
        >
          {activo ? 'Suspender acceso' : 'Reactivar acceso'}
        </button>
      </form>
    </Card>
  )
}
