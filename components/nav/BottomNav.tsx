import Link from 'next/link'
import type { Rol } from '@/lib/supabase/types'

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
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 z-10 flex border-t border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      {navItemsFor(rol).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex h-16 min-w-0 flex-1 items-center justify-center px-1 text-center text-xs font-medium text-[var(--color-muted)] transition-colors active:text-[var(--color-accent)]"
        >
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
