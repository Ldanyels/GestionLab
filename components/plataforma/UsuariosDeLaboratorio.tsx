import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import type { UsuarioItem } from '@/lib/usuarios/data'

const ETIQUETA_ROL = { admin: 'Administrador', tecnico: 'Técnico' } as const

/**
 * Los usuarios de un laboratorio ajeno, con lo único que el soporte necesita:
 * poder devolverle el acceso a alguien.
 *
 * No hay botón de borrar, y es una decisión, no un olvido: borrar elimina en
 * cascada el perfil de esa persona, y quien opera la plataforma no sabe si
 * sigue trabajando ahí. Su propio administrador sí lo sabe y ya puede hacerlo
 * desde su pantalla de usuarios.
 */
export function UsuariosDeLaboratorio({
  labId,
  usuarios,
  accion,
}: {
  labId: string
  usuarios: readonly UsuarioItem[]
  accion: (formData: FormData) => Promise<void>
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold tracking-[-0.01em]">Usuarios</h2>
        <Link
          href={`/plataforma/${labId}/usuarios/nuevo`}
          className="text-[13.5px] font-semibold text-[var(--color-accent)]"
        >
          + Usuario
        </Link>
      </div>

      {usuarios.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
          <p className="text-[14px] font-semibold">Este laboratorio no tiene usuarios</p>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">
            Sin al menos un administrador, nadie puede entrar.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {usuarios.map((u) => (
            <li key={u.id}>
              <Card tono="lista" className="space-y-3 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{u.nombre}</p>
                    <p className="truncate text-[13px] text-[var(--color-muted)]">{u.email}</p>
                  </div>
                  <Chip tono={u.rol === 'admin' ? 'exito' : 'neutro'}>
                    {ETIQUETA_ROL[u.rol]}
                  </Chip>
                </div>

                <form
                  action={accion}
                  className="flex flex-wrap items-end gap-2 border-t border-[var(--color-border)] pt-3"
                >
                  <input type="hidden" name="laboratorio_id" value={labId} />
                  <input type="hidden" name="usuario_id" value={u.id} />
                  <input type="hidden" name="nombre" value={u.nombre} />
                  <label className="space-y-1">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                      Contraseña nueva
                    </span>
                    {/*
                      `type="text"` a propósito: el operador la dicta por
                      teléfono. Ocultarla obligaría a teclear a ciegas una clave
                      que además es temporal.
                    */}
                    <input
                      type="text"
                      name="password"
                      autoComplete="off"
                      minLength={6}
                      required
                      className="h-11 w-[190px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
                    />
                  </label>
                  <button
                    type="submit"
                    className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-semibold"
                  >
                    Restablecer
                  </button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
