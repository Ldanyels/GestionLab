import Link from 'next/link'

/**
 * Sesión válida sin perfil utilizable.
 *
 * No redirige a ninguna parte a propósito: mandar a `/login` haría un bucle
 * con `/hoy`. En su lugar explica qué pasó, distinguiendo el fallo de lectura
 * —típicamente una migración pendiente en Supabase— de un usuario que de
 * verdad no está vinculado a ningún laboratorio.
 *
 * Ese segundo caso incluye a quien administra la plataforma: su cuenta no
 * pertenece a ningún inquilino, y como el login siempre aterriza en `/hoy`,
 * sin el enlace de aquí tendría que escribir la dirección del panel a mano en
 * cada entrada.
 */
export function PantallaSinLaboratorio({
  error,
  esSuperAdmin = false,
}: {
  /** Mensaje del fallo al leer el perfil, o `null` si simplemente no existe. */
  error: string | null
  esSuperAdmin?: boolean
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-semibold">
          {error ? 'No pudimos leer tu perfil' : 'Cuenta sin laboratorio'}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {error
            ? 'La base de datos rechazó la consulta del perfil. Suele ser una migración pendiente en Supabase.'
            : 'Tu usuario aún no está vinculado a un laboratorio. Pide al administrador que complete la configuración y vuelve a intentar.'}
        </p>
        {error ? (
          <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2 text-left text-xs text-[var(--color-muted)]">
            Detalle: {error}
          </p>
        ) : null}

        {esSuperAdmin ? (
          <Link
            href="/plataforma"
            className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-contrast)]"
          >
            Ir al panel de Plataforma
          </Link>
        ) : null}

        <a
          href="/login/logout"
          className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm"
        >
          Salir
        </a>
      </div>
    </main>
  )
}
