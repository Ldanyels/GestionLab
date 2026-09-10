import { createServerSupabase } from '@/lib/supabase/server'

export interface AuditItem {
  id: number
  tabla: string
  accion: 'INSERT' | 'UPDATE' | 'DELETE' | 'ACCESO'
  usuario_nombre: string | null
  /** Correo del proveedor, si el registro lo originó el panel de plataforma. */
  actor_plataforma: string | null
  /** Qué se hizo, en los cambios que vienen del panel. */
  detalle: string | null
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
  perfil: 'Usuario',
  laboratorio: 'Cuenta del laboratorio',
}

const ETIQUETA_ACCION: Record<string, string> = {
  INSERT: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
  // No es un cambio de datos: registra que el proveedor abrió la cuenta.
  ACCESO: 'Consultó',
}

export function etiquetaTabla(t: string): string {
  return ETIQUETA_TABLA[t] ?? t
}
export function etiquetaAccion(a: string): string {
  return ETIQUETA_ACCION[a] ?? a
}

type Origen = Pick<AuditItem, 'usuario_nombre' | 'actor_plataforma'>

/** ¿Este registro lo originó el proveedor y no el propio laboratorio? */
export function esDePlataforma(e: Origen): boolean {
  return Boolean(e.actor_plataforma)
}

/**
 * Quién hizo esto, en una línea.
 *
 * Antes, un cambio venido del panel de plataforma se mostraba como «Sistema»,
 * porque el disparador guarda `auth.uid()` y con la clave de servicio eso es
 * nulo. Era engañoso: no lo hizo el sistema, lo hizo una persona con nombre y
 * correo, y el laboratorio tiene derecho a distinguir eso de lo que hace su
 * propio equipo.
 */
export function quienActuo(e: Origen): string {
  if (e.actor_plataforma) return `Soporte de GestionLab (${e.actor_plataforma})`
  return e.usuario_nombre ?? 'Sistema'
}

const COLUMNAS = 'id, tabla, accion, usuario_nombre, actor_plataforma, detalle, creado_en'
const COLUMNAS_SIN_PLATAFORMA = 'id, tabla, accion, usuario_nombre, creado_en'

export async function listAuditoria(limit = 100): Promise<AuditItem[]> {
  const supabase = await createServerSupabase()

  const consulta = (columnas: string) =>
    supabase
      .from('auditoria')
      .select(columnas)
      .order('creado_en', { ascending: false })
      .limit(limit)

  let { data, error } = await consulta(COLUMNAS)

  // Migraciones 0020/0021 pendientes (42703: columna inexistente): se muestra
  // el historial sin la atribución de plataforma en vez de una pantalla vacía.
  if (error?.code === '42703') {
    const respaldo = await consulta(COLUMNAS_SIN_PLATAFORMA)
    data = respaldo.data
    error = respaldo.error
  }
  if (error) return []

  // Se construye campo por campo: con el respaldo, las dos columnas nuevas no
  // vienen en la fila, y un `spread` sobre valores por defecto los pisaría con
  // `undefined` en vez de dejarlos en nulo.
  type Cruda = Partial<AuditItem> & Pick<AuditItem, 'id' | 'tabla' | 'accion' | 'creado_en'>
  return (data as unknown as Cruda[]).map((f) => ({
    id: f.id,
    tabla: f.tabla,
    accion: f.accion,
    creado_en: f.creado_en,
    usuario_nombre: f.usuario_nombre ?? null,
    actor_plataforma: f.actor_plataforma ?? null,
    detalle: f.detalle ?? null,
  }))
}
