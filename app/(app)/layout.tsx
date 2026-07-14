import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionContext } from '@/lib/auth'
import { BottomNav } from '@/components/nav/BottomNav'
import { LogoDiente } from '@/components/nav/icons'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, perfil } = await getSessionContext()

  // Sin sesión → al login.
  if (!userId) redirect('/login')

  // Sesión válida pero sin perfil vinculado a un laboratorio.
  // No redirigimos (evita el bucle /hoy ↔ /login): mostramos un aviso claro.
  if (!perfil) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-semibold">Cuenta sin laboratorio</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Tu usuario aún no está vinculado a un laboratorio. Pide al
            administrador que complete la configuración y vuelve a intentar.
          </p>
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

  return (
    <div className="min-h-dvh pb-16">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 backdrop-blur">
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <LogoDiente className="text-[var(--color-accent)]" width={20} height={20} />
          GestionLab
        </span>
        <nav className="flex items-center gap-3 text-sm">
          <ThemeToggle />
          {perfil.rol === 'admin' ? (
            <Link href="/configuracion" className="text-[var(--color-muted)]">
              Configuración
            </Link>
          ) : null}
          <a
            href="/login/logout"
            className="text-[var(--color-muted)] transition-colors active:text-[var(--color-danger)]"
          >
            Salir
          </a>
        </nav>
      </header>
      <main className="mx-auto max-w-2xl p-4">{children}</main>
      <BottomNav rol={perfil.rol} />
    </div>
  )
}
