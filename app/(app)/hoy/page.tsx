import { getSessionPerfil } from '@/lib/auth'

export default async function HoyPage() {
  const perfil = await getSessionPerfil()
  return (
    <section className="space-y-2">
      <h1 className="text-xl font-semibold tracking-tight">Hoy</h1>
      <p className="text-[var(--color-muted)]">
        Hola, {perfil?.nombre}. Aquí verás los trabajos del día.
      </p>
    </section>
  )
}
