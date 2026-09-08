import { redirect } from 'next/navigation'
import { getSessionContext } from '@/lib/auth'
import { AppShell } from '@/components/nav/AppShell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, perfil, error } = await getSessionContext()

  // Sin sesión → al login.
  if (!userId) redirect('/login')

  // Sesión válida pero sin perfil utilizable. No redirigimos (evita el bucle
  // /hoy ↔ /login): mostramos qué pasó, distinguiendo el fallo de lectura
  // (ej. migración pendiente) de un usuario realmente sin laboratorio.
  if (!perfil) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
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

  return <AppShell perfil={perfil}>{children}</AppShell>
}
