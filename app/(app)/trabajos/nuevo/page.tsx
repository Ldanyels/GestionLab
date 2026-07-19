import Link from 'next/link'
import { listDoctoresConConsultorio } from '@/lib/consultorios/data'
import { listCatalogo } from '@/lib/catalogo/data'
import { TrabajoForm } from '@/components/trabajos/TrabajoForm'
import { crearTrabajoAction } from '../actions'

export default async function NuevoTrabajoPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>
}) {
  const { doctor } = await searchParams
  const [doctores, tipos] = await Promise.all([
    listDoctoresConConsultorio(),
    listCatalogo(),
  ])

  const faltaBase = doctores.length === 0 || tipos.length === 0

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/trabajos" className="text-[var(--color-muted)]">
          ‹
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Nuevo trabajo</h1>
      </div>

      {faltaBase ? (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 text-sm">
          <p className="font-medium">Falta información base:</p>
          {doctores.length === 0 ? (
            <p>
              • No hay doctores.{' '}
              <Link href="/consultorios" className="text-[var(--color-accent)]">
                Agrega un consultorio y su doctor
              </Link>
              .
            </p>
          ) : null}
          {tipos.length === 0 ? (
            <p>
              • No hay tipos de trabajo.{' '}
              <Link href="/configuracion/catalogo" className="text-[var(--color-accent)]">
                Configura el catálogo
              </Link>
              .
            </p>
          ) : null}
        </div>
      ) : (
        <TrabajoForm
          action={crearTrabajoAction}
          doctores={doctores}
          tipos={tipos}
          doctorInicial={doctor}
          submitLabel="Crear trabajo"
        />
      )}
    </section>
  )
}
