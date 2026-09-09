'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItemsFor } from './destinos'
import { ICONOS, LogoDiente } from './icons'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { Perfil } from '@/lib/supabase/types'

/**
 * Barra lateral de 236 px: solo en escritorio (≥980 px).
 *
 * `esSuperAdmin` llega como prop porque esto es un componente de cliente y no
 * puede comprobarlo: quién administra la plataforma se decide con una variable
 * de entorno del servidor, que el navegador nunca ve.
 */
export function Sidebar({
  perfil,
  esSuperAdmin = false,
}: {
  perfil: Perfil
  esSuperAdmin?: boolean
}) {
  const pathname = usePathname()
  const activo = (href: string) =>
    pathname === href || (pathname?.startsWith(`${href}/`) ?? false)

  return (
    <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 min-[980px]:flex">
      <span className="flex items-center gap-2 px-2 py-1 text-lg font-bold tracking-tight">
        <LogoDiente className="text-[var(--color-accent)]" width={22} height={22} />
        GestionLab
      </span>

      <nav aria-label="Navegación principal" className="mt-6 flex flex-col gap-1">
        {navItemsFor(perfil).map((item) => {
          const Icono = ICONOS[item.href as keyof typeof ICONOS]
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo(item.href) ? 'page' : undefined}
              className={`flex h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors ${
                activo(item.href)
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {Icono ? <Icono /> : null}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-[var(--color-border)] pt-3">
        {esSuperAdmin ? (
          <Link
            href="/plataforma"
            className="flex h-11 items-center rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-surface-2)]"
          >
            Plataforma
          </Link>
        ) : null}
        {perfil.rol === 'admin' ? (
          <Link
            href="/configuracion"
            className="flex h-11 items-center rounded-[var(--radius-md)] px-3 text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)]"
          >
            Configuración
          </Link>
        ) : null}
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-sm text-[var(--color-muted)]">Tema</span>
          <ThemeToggle />
        </div>
        <a
          href="/login/logout"
          className="flex h-11 items-center rounded-[var(--radius-md)] px-3 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-danger)]"
        >
          Salir
        </a>
      </div>
    </aside>
  )
}
