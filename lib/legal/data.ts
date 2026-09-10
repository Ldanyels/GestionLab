import { createAdminSupabase } from '@/lib/supabase/admin'
import { DOCUMENTOS_LEGALES } from './textos.generated'
import {
  documentosPendientes,
  type AceptacionRegistrada,
  type DatosDeAceptacion,
} from './pendientes'

/**
 * Acceso al registro de aceptaciones.
 *
 * Va por la clave de servicio porque la tabla tiene RLS activo y ninguna
 * política: nadie llega a ella desde el navegador. El acotado por laboratorio
 * se hace aquí, explícito en cada consulta.
 */

export interface AceptacionCompleta extends AceptacionRegistrada {
  nombre_completo: string
  dni: string
  cargo: string | null
  usuario_correo: string
  creado_en: string
}

/** Qué ha aceptado este laboratorio. */
export async function aceptacionesDeLaboratorio(
  laboratorioId: string,
): Promise<AceptacionCompleta[]> {
  const admin = createAdminSupabase()
  const { data, error } = await admin
    .from('aceptacion')
    .select('documento, version, nombre_completo, dni, cargo, usuario_correo, creado_en')
    .eq('laboratorio_id', laboratorioId)
    .order('creado_en', { ascending: false })

  // Sin la migración 0022 la tabla no existe. Se devuelve vacío en vez de
  // reventar: el resultado es que se pide aceptar, que es el lado seguro.
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return (data ?? []) as unknown as AceptacionCompleta[]
}

/** Qué le falta por aceptar a este laboratorio. */
export async function pendientesDeLaboratorio(laboratorioId: string) {
  return documentosPendientes(await aceptacionesDeLaboratorio(laboratorioId))
}

export interface ContextoDeAceptacion {
  laboratorioId: string
  usuarioId: string
  usuarioCorreo: string
  ip: string | null
  agente: string | null
  firmaSvg: string | null
}

/**
 * Registra la aceptación de **todos** los documentos pendientes, en un solo
 * acto.
 *
 * Se insertan juntos porque se aceptaron juntos: la pantalla los muestra a la
 * vez y la persona marca las tres casillas antes de continuar. Guardar una fila
 * por documento —en vez de una sola con los tres— permite que mañana cambie
 * solo la política de privacidad y haya que volver a aceptar únicamente esa.
 *
 * Devuelve las filas escritas, que son las que van a la constancia en PDF.
 */
export async function registrarAceptacion(
  ctx: ContextoDeAceptacion,
  datos: DatosDeAceptacion,
  claves: readonly string[],
): Promise<AceptacionCompleta[]> {
  const aDocumento = new Map(DOCUMENTOS_LEGALES.map((d) => [d.clave, d]))
  const filas = claves
    .map((c) => aDocumento.get(c as never))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map((d) => ({
      laboratorio_id: ctx.laboratorioId,
      usuario_id: ctx.usuarioId,
      usuario_correo: ctx.usuarioCorreo,
      documento: d.clave,
      version: d.version,
      hash: d.hash,
      nombre_completo: datos.nombre,
      dni: datos.dni,
      cargo: datos.cargo,
      ip: ctx.ip,
      agente: ctx.agente,
      firma_svg: ctx.firmaSvg,
    }))

  if (filas.length === 0) return []

  const admin = createAdminSupabase()
  const { data, error } = await admin
    .from('aceptacion')
    .insert(filas)
    .select('documento, version, nombre_completo, dni, cargo, usuario_correo, creado_en')
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AceptacionCompleta[]
}
