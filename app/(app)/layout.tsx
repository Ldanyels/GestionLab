import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { getSessionPerfil } from '@/lib/auth'
import { BottomNav } from '@/components/nav/BottomNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Sin sesión → al login (sin bucle: el middleware ya no reenvía aquí).
  if (!user) redirect('/login')

  const perfil = await getSessionPerfil()

  // Sesión válida pero sin perfil vinculado a un laboratorio.
  // No redirigimos (evita el bucle /hoy ↔ /login): mostramos un aviso claro.
  if (!perfil) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-semibold">Cuenta sin laboratorio</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Tu usuario aún no está vinculado a un laboratorio. Pide al
            administrador que complete la configuración (tabla{' '}
            <code>perfil</code>) y vuelve a intentar.
          </p>
          <form action="/login/logout" method="post">
            <button
              type="submit"
              className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm"
            >
              Salir
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-dvh pb-16">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 backdrop-blur">
        <span className="font-semibold tracking-tight">GestionLab</span>
        <form action="/login/logout" method="post">
          <button
            type="submit"
            className="text-sm text-[var(--color-muted)] transition-colors active:text-[var(--color-danger)]"
          >
            Salir
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-2xl p-4">{children}</main>
      <BottomNav rol={perfil.rol} />
    </div>
  )
}
