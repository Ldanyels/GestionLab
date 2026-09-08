'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { puede, type Permiso } from '@/lib/permisos'
import type { Perfil, Rol } from '@/lib/supabase/types'
import { ICONOS } from './icons'

export interface NavItem {
  label: string
  href: string
  roles: Rol[]
  /** Si se indica, el técnico solo lo ve con este permiso. */
  permiso?: Permiso
}

const ALL_ITEMS: NavItem[] = [
  { label: 'Hoy', href: '/hoy', roles: ['admin', 'tecnico'] },
  { label: 'Consultorios', href: '/consultorios', roles: ['admin', 'tecnico'] },
  { label: 'Trabajos', href: '/trabajos', roles: ['admin', 'tecnico'] },
  {
    label: 'Inventario',
    href: '/inventario',
    roles: ['admin', 'tecnico'],
    permiso: 'inventario_ver',
  },
  { label: 'Finanzas', href: '/finanzas', roles: ['admin'] },
  {
    label: 'Reportes',
    href: '/reportes',
    roles: ['tecnico'],
    permiso: 'reportes',
  },
]

/** Entradas visibles para un perfil: por rol y, si aplica, por permiso. */
export function navItemsFor(perfil: Perfil): NavItem[] {
  return ALL_ITEMS.filter(
    (i) => i.roles.includes(perfil.rol) && (!i.permiso || puede(perfil, i.permiso)),
  )
}

export function BottomNav({ perfil }: { perfil: Perfil }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItemsFor(perfil).map((item) => {
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
