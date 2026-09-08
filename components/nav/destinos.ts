import { puede, type Permiso } from '@/lib/permisos'
import type { Perfil, Rol } from '@/lib/supabase/types'

export interface NavItem {
  label: string
  href: string
  roles: Rol[]
  /** Si se indica, el técnico solo lo ve con este permiso. */
  permiso?: Permiso
}

/** Los cinco destinos del rediseño. Configuración vive en el header/barra lateral. */
export const NAV_PRINCIPAL: NavItem[] = [
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
]

/**
 * Destino extra del técnico: sin él no tendría ninguna vía a Reportes,
 * porque Finanzas y Estado de cuenta son solo de administrador.
 */
const NAV_TECNICO: NavItem[] = [
  { label: 'Reportes', href: '/reportes', roles: ['tecnico'], permiso: 'reportes' },
]

/** Entradas visibles para un perfil: por rol y, si aplica, por permiso. */
export function navItemsFor(perfil: Perfil): NavItem[] {
  return [...NAV_PRINCIPAL, ...NAV_TECNICO].filter(
    (i) => i.roles.includes(perfil.rol) && (!i.permiso || puede(perfil, i.permiso)),
  )
}
