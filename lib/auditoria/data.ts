import { createServerSupabase } from '@/lib/supabase/server'

export interface AuditItem {
  id: number
  tabla: string
  accion: 'INSERT' | 'UPDATE' | 'DELETE'
  usuario_nombre: string | null
  creado_en: string
}

const ETIQUETA_TABLA: Record<string, string> = {
  trabajo: 'Trabajo',
  abono: 'Abono',
  pago_trabajador: 'Pago a trabajador',
  movimiento_inventario: 'Movimiento de inventario',
  catalogo_trabajo: 'Catálogo',
  consultorio: 'Consultorio',
  doctor: 'Doctor',
  producto: 'Producto',
}

const ETIQUETA_ACCION: Record<string, string> = {
  INSERT: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
}

export function etiquetaTabla(t: string): string {
  return ETIQUETA_TABLA[t] ?? t
}
export function etiquetaAccion(a: string): string {
  return ETIQUETA_ACCION[a] ?? a
}

export async function listAuditoria(limit = 100): Promise<AuditItem[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('auditoria')
    .select('id, tabla, accion, usuario_nombre, creado_en')
    .order('creado_en', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as AuditItem[]
}
