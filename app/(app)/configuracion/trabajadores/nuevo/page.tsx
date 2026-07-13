import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { TrabajadorForm } from '@/components/trabajadores/TrabajadorForm'
import { crearTrabajadorAction } from '../actions'

export default async function NuevoTrabajadorPage() {
  await requireAdmin()
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/configuracion/trabajadores" className="text-[var(--color-muted)]">
          ‹
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Nuevo trabajador</h1>
      </div>
      <TrabajadorForm action={crearTrabajadorAction} submitLabel="Guardar" />
    </section>
  )
}
