export function EnConstruccion({ titulo }: { titulo: string }) {
  return (
    <section className="flex min-h-[60dvh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
      <p className="text-sm text-[var(--color-muted)]">
        Este módulo está en construcción. Muy pronto disponible.
      </p>
    </section>
  )
}
