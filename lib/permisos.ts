import type { Perfil } from '@/lib/supabase/types'

export const PERMISOS = [
  'reportes',
  'reportes_montos',
  'inventario_ver',
  'inventario_editar',
] as const

export type Permiso = (typeof PERMISOS)[number]

export interface PermisoInfo {
  id: Permiso
  etiqueta: string
  descripcion: string
}

/** Catálogo de permisos asignables, en el orden en que se muestran. */
export const CATALOGO_PERMISOS: PermisoInfo[] = [
  {
    id: 'reportes',
    etiqueta: 'Ver reportes',
    descripcion: 'Reportes por consultorio y doctor, sin importes en soles.',
  },
  {
    id: 'reportes_montos',
    etiqueta: 'Reportes con importes',
    descripcion:
      'Los reportes que emita incluyen montos y deuda, para entregarlos al doctor o consultorio. Incluye ver reportes.',
  },
  {
    id: 'inventario_ver',
    etiqueta: 'Ver inventario',
    descripcion: 'Consultar stock de insumos (sin costos).',
  },
  {
    id: 'inventario_editar',
    etiqueta: 'Registrar movimientos',
    descripcion: 'Entradas, salidas y mermas de insumos. Incluye ver inventario.',
  },
]

/** Permisos que implica otro (registrar movimientos implica poder verlos). */
const IMPLICA: Partial<Record<Permiso, Permiso[]>> = {
  inventario_editar: ['inventario_ver'],
  reportes_montos: ['reportes'],
}

export function esPermiso(v: string): v is Permiso {
  return (PERMISOS as readonly string[]).includes(v)
}

/** Normaliza una lista de permisos: descarta desconocidos y agrega los implicados. */
export function normalizarPermisos(valores: readonly string[]): Permiso[] {
  const set = new Set<Permiso>()
  for (const v of valores) {
    if (!esPermiso(v)) continue
    set.add(v)
    for (const extra of IMPLICA[v] ?? []) set.add(extra)
  }
  return PERMISOS.filter((p) => set.has(p))
}

/** ¿El perfil puede hacer esto? El admin siempre puede. */
export function puede(perfil: Perfil | null, permiso: Permiso): boolean {
  if (!perfil) return false
  if (perfil.rol === 'admin') return true
  return normalizarPermisos(perfil.permisos ?? []).includes(permiso)
}

/** Solo el admin ve importes internos (costos de insumos, márgenes). */
export function veMontos(perfil: Perfil | null): boolean {
  return perfil?.rol === 'admin'
}

/**
 * ¿Sus reportes salen con importes? El admin siempre; el técnico solo con el
 * permiso 'reportes_montos' (para poder entregar la cuenta al doctor).
 */
export function veMontosReportes(perfil: Perfil | null): boolean {
  return puede(perfil, 'reportes_montos')
}
