import Link from 'next/link'
import { listConsultoriosConConteo } from '@/lib/consultorios/data'
import { getSessionPerfil } from '@/lib/auth'
import { veMontos } from '@/lib/permisos'
import { deudaPorConsultorio } from '@/lib/consultorios/deuda'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { SearchBox } from '@/components/ui/SearchBox'

export default async function ConsultoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archivados?: string }>
}) {
  const { q, archivados } = await searchParams
  const verArchivados = archivados === '1'
  const perfil = await getSessionPerfil()
  const montos = veMontos(perfil)
  // La deuda la agrega la base (RPC), no se traen todos los trabajos.
  const [consultorios, cuentas] = await Promise.all([
    listConsultoriosConConteo(q, verArchivados),
    montos ? deudaPorConsultorio() : Promise.resolve([]),
  ])

  const deudaPorId = new Map(cuentas.map((c) => [c.consultorio_id, c.saldo]))

  return (
    <section className="space-y-4">
      {/* En móvil los botones bajan a su propia fila: no caben junto al título. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h1 className="text-[28px] font-bold tracking-[-0.03em]">Consultorios</h1>
        <div className="flex gap-2">
          {montos ? (
            <Link
              href="/consultorios/cuentas"
              className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold"
            >
              Estado de cuenta
            </Link>
          ) : null}
          <Link
            href="/consultorios/nuevo"
            className="inline-flex h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
          >
            + Nuevo
          </Link>
        </div>
      </div>

      <SearchBox
        placeholder="Buscar consultorio…"
        defaultValue={q}
        hidden={verArchivados ? { archivados: '1' } : undefined}
      />

      <Link
        href={verArchivados ? '/consultorios' : '/consultorios?archivados=1'}
        className="inline-block text-[13.5px] text-[var(--color-muted)] underline"
      >
        {verArchivados ? '← Ver activos' : 'Ver archivados'}
      </Link>

      {consultorios.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[15px] font-semibold">
            {verArchivados ? 'Sin consultorios archivados' : 'Sin consultorios'}
          </p>
          <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
            {q
              ? 'Prueba con otro nombre.'
              : verArchivados
                ? 'Los que archives aparecerán aquí.'
                : 'Toca «+ Nuevo» para agregar el primero.'}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
          {consultorios.map((c) => {
            const deuda = deudaPorId.get(c.id) ?? 0
            const doctores = c.doctores
            return (
              <li key={c.id}>
                <Link href={`/consultorios/${c.id}`} className="block h-full">
                  <Card
                    tono="lista"
                    colorLateral={colorConsultorio(c.nombre)}
                    className="flex h-full items-center gap-3 p-3.5 transition-transform hover:-translate-y-px"
                  >
                    <Avatar nombre={c.nombre} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15.5px] font-semibold">
                        {c.nombre}
                      </span>
                      <span className="block truncate text-[12.5px] text-[var(--color-muted)]">
                        {doctores} doctor{doctores === 1 ? '' : 'es'}
                        {c.contacto ? ` · ${c.contacto}` : ''}
                      </span>
                    </span>
                    {montos ? (
                      <span
                        className={`num shrink-0 text-sm font-bold ${
                          deuda > 0.001
                            ? 'text-[var(--color-danger)]'
                            : 'text-[var(--color-muted)]'
                        }`}
                      >
                        {deuda > 0.001 ? formatMoney(deuda) : '—'}
                      </span>
                    ) : null}
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
