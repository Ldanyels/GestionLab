import Link from 'next/link'
import { BackRow } from '@/components/ui/BackRow'
import { getSessionPerfil } from '@/lib/auth'
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
  const [doctores, tipos, perfil] = await Promise.all([
    listDoctoresConConsultorio(),
    listCatalogo(),
    getSessionPerfil(),
  ])

  const faltaBase = doctores.length === 0 || tipos.length === 0
  // El catálogo se configura en /configuracion, que exige rol admin. Al técnico
  // no se le ofrece un enlace que lo devolvería a Hoy en silencio: se le dice a
  // quién pedírselo.
  const esAdmin = perfil?.rol === 'admin'

  return (
    <section className="space-y-4">
      <BackRow href="/trabajos" titulo="Nuevo trabajo" />

      {faltaBase ? (
        <div className="space-y-2.5 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-5 text-sm">
          <p className="text-[15px] font-semibold">Antes de crear un trabajo</p>

          {doctores.length === 0 ? (
            <p className="leading-relaxed text-[var(--color-muted)]">
              Falta el doctor que lo encarga.{' '}
              <Link
                href="/consultorios"
                className="font-semibold text-[var(--color-accent)]"
              >
                Agrega un consultorio y su doctor
              </Link>
              .
            </p>
          ) : null}

          {tipos.length === 0 ? (
            <p className="leading-relaxed text-[var(--color-muted)]">
              Falta el tipo de trabajo —una corona, una base metálica— con su precio.{' '}
              {esAdmin ? (
                <>
                  <Link
                    href="/configuracion/catalogo/nuevo"
                    className="font-semibold text-[var(--color-accent)]"
                  >
                    Crea el primero en el catálogo
                  </Link>
                  .
                </>
              ) : (
                'Pídele a tu administrador que configure el catálogo.'
              )}
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
