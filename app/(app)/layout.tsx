import { redirect } from 'next/navigation'
import { getSessionPerfil } from '@/lib/auth'
import { BottomNav } from '@/components/nav/BottomNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const perfil = await getSessionPerfil()
  if (!perfil) redirect('/login')

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
