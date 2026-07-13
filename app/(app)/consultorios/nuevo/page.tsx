import Link from 'next/link'
import { ConsultorioForm } from '@/components/consultorios/ConsultorioForm'
import { crearConsultorioAction } from '../actions'

export default function NuevoConsultorioPage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/consultorios" className="text-[var(--color-muted)]">
          ‹
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Nuevo consultorio</h1>
      </div>
      <ConsultorioForm action={crearConsultorioAction} submitLabel="Guardar" />
    </section>
  )
}
