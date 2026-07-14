'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Rol } from '@/lib/supabase/types'
import { ICONOS } from './icons'

export interface NavItem {
  label: string
  href: string
  roles: Rol[]
}

const ALL_ITEMS: NavItem[] = [
  { label: 'Hoy', href: '/hoy', roles: ['admin', 'tecnico'] },
  { label: 'Consultorios', href: '/consultorios', roles: ['admin', 'tecnico'] },
  { label: 'Trabajos', href: '/trabajos', roles: ['admin', 'tecnico'] },
  { label: 'Inventario', href: '/inventario', roles: ['admin'] },
  { label: 'Finanzas', href: '/finanzas', roles: ['admin'] },
]

export function navItemsFor(rol: Rol): NavItem[] {
  return ALL_ITEMS.filter((i) => i.roles.includes(rol))
}

export function BottomNav({ rol }: { rol: Rol }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItemsFor(rol).map((item) => {
        const Icono = ICONOS[item.href as keyof typeof ICONOS]
        const activo =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? 'page' : undefined}
            className={`flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              activo ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
            }`}
          >
            <span
              className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
                activo ? 'bg-[var(--color-accent-soft)]' : ''
              }`}
            >
              {Icono ? <Icono /> : null}
            </span>
            <span className="max-w-full truncate text-[11px] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
