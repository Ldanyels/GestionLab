import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'

export default async function ConfiguracionPage() {
  await requireAdmin()

  const secciones = [
    {
      href: '/configuracion/catalogo',
      titulo: 'Catálogo de trabajos',
      descripcion: 'Tipos de trabajo, precios, etapas y recetas.',
    },
    {
      href: '/configuracion/trabajadores',
      titulo: 'Trabajadores',
      descripcion: 'Personal, montos estándar y pagos.',
    },
    {
      href: '/configuracion/usuarios',
      titulo: 'Usuarios',
      descripcion: 'Accesos del equipo (admin / técnico).',
    },
  ]

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Configuración</h1>
      <ul className="space-y-2">
        {secciones.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:border-[var(--color-accent)]"
            >
              <span>
                <span className="block font-medium">{s.titulo}</span>
                <span className="block text-sm text-[var(--color-muted)]">
                  {s.descripcion}
                </span>
              </span>
              <span aria-hidden className="text-[var(--color-muted)]">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
