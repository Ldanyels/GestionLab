import Link from 'next/link'
import { requireAdmin, getSessionContext } from '@/lib/auth'
import { listUsuarios } from '@/lib/usuarios/data'
import { UsuarioForm } from '@/components/usuarios/UsuarioForm'
import { PermisosEditor } from '@/components/usuarios/PermisosEditor'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cambiarRolAction, eliminarUsuarioAction } from './actions'

export default async function UsuariosPage() {
  await requireAdmin()
  const { userId } = await getSessionContext()

  let usuarios: Awaited<ReturnType<typeof listUsuarios>> = []
  let errorClave = ''
  try {
    usuarios = await listUsuarios()
  } catch (e) {
    errorClave = e instanceof Error ? e.message : 'Error al listar usuarios'
  }

  return (
    <section className="space-y-6">
      <div>
        <Link href="/configuracion" className="text-sm text-[var(--color-muted)]">
          ‹ Configuración
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Crea accesos para tu equipo. El técnico parte sin reportes ni inventario;
          abajo le habilitas lo que necesite. Los costos de insumos y el panel de
          Finanzas quedan siempre solo para administradores.
        </p>
      </div>

      {errorClave ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)] p-3 text-sm">
          <p className="font-medium text-[var(--color-danger)]">
            Falta configurar la clave secreta
          </p>
          <p className="mt-1 text-[var(--color-muted)]">
            Para gestionar usuarios, agrega tu <code>SUPABASE_SERVICE_ROLE_KEY</code> en{' '}
            <code>.env.local</code> y reinicia el servidor. Detalle: {errorClave}
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {usuarios.map((u) => (
              <li
                key={u.id}
                className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {u.nombre}
                    {u.id === userId ? (
                      <span className="text-[var(--color-muted)]"> (tú)</span>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-[var(--color-muted)]">
                    {u.email}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {u.id === userId ? (
                    <span className="text-xs text-[var(--color-muted)]">
                      {u.rol === 'admin' ? 'Admin' : 'Técnico'}
                    </span>
                  ) : (
                    <>
                      <form action={cambiarRolAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <select
                          name="rol"
                          defaultValue={u.rol}
                          className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"
                        >
                          <option value="tecnico">Técnico</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button type="submit" className="ml-1 text-xs text-[var(--color-accent)]">
                          Guardar
                        </button>
                      </form>
                      <ConfirmDialog
                        action={eliminarUsuarioAction}
                        fields={{ id: u.id }}
                        triggerLabel="Eliminar"
                        triggerClassName="text-xs text-[var(--color-danger)]"
                        title="Eliminar usuario"
                        message={`¿Eliminar el acceso de "${u.nombre}"? No podrá iniciar sesión.`}
                      />
                    </>
                  )}
                </span>
                </div>

                {u.rol === 'tecnico' ? (
                  <div className="border-t border-[var(--color-border)] pt-3">
                    <PermisosEditor
                      usuarioId={u.id}
                      nombre={u.nombre}
                      permisos={u.permisos}
                    />
                  </div>
                ) : (
                  <p className="border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted)]">
                    Como administrador tiene acceso completo: finanzas, inventario,
                    reportes y configuración.
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <h2 className="text-lg font-medium">Nuevo usuario</h2>
            <UsuarioForm />
          </div>
        </>
      )}
    </section>
  )
}
