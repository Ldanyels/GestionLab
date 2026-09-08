'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItemsFor } from './destinos'
import { ICONOS } from './icons'
import type { Perfil } from '@/lib/supabase/types'

/** Barra inferior: solo en móvil. En ≥980 px manda la barra lateral. */
export function BottomNav({ perfil }: { perfil: Perfil }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur-md min-[980px]:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItemsFor(perfil).map((item) => {
        const Icono = ICONOS[item.href as keyof typeof ICONOS]
        const activo =
          pathname === item.href || (pathname?.startsWith(`${item.href}/`) ?? false)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? 'page' : undefined}
            className={`flex h-[62px] min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-colors ${
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
