import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { Card } from '@/components/ui/Card'

const SECCIONES = [
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
    titulo: 'Usuarios y permisos',
    descripcion: 'Accesos del equipo (admin / técnico).',
  },
  {
    href: '/configuracion/auditoria',
    titulo: 'Historial de actividad',
    descripcion: 'Quién creó, cambió o eliminó registros.',
  },
]

export default async function ConfiguracionPage() {
  await requireAdmin()

  return (
    <section className="mx-auto max-w-[620px] space-y-4">
      <h1 className="text-[28px] font-bold tracking-[-0.03em]">Configuración</h1>
      <ul className="space-y-2.5">
        {SECCIONES.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="block">
              <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:border-[var(--color-accent)]">
                <span className="min-w-0">
                  <span className="block text-base font-semibold">{s.titulo}</span>
                  <span className="block text-[13px] text-[var(--color-muted)]">
                    {s.descripcion}
                  </span>
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="shrink-0 text-[var(--color-muted)]"
                  aria-hidden
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
