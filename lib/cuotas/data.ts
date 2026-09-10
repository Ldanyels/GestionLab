import { createAdminSupabase } from '@/lib/supabase/admin'
import { registrarError } from '@/lib/registro'
import { hoyLima } from '@/lib/trabajos/agenda'
import { periodosFaltantes, type Periodicidad } from './periodos'
import type { CuotaResumible } from './resumen'

/**
 * Acceso al registro de cuotas.
 *
 * Va por la clave de servicio: esto es contabilidad del proveedor, no datos del
 * inquilino, y la tabla tiene RLS activo sin ninguna política. Ningún
 * laboratorio ve lo que se le cobra a otro porque no llega a la tabla en
 * absoluto.
 */

export interface Cuota extends CuotaResumible {
  id: string
  laboratorio_id: string
  periodo_inicio: string
  periodo_fin: string
  emitida_el: string
  medio_pago: string | null
  comprobante: string | null
  nota: string | null
}

export interface CondicionesDeCobro {
  id: string
  nombre: string
  plan: string
  periodicidad: Periodicidad | null
  precio_cuota: number | null
  inicio_cobro: string | null
}

const COLUMNAS =
  'id, laboratorio_id, periodo_inicio, periodo_fin, emitida_el, vence_el, monto, estado, pagada_el, medio_pago, comprobante, nota'

/** Sin la migración 0024 no hay nada que leer; se devuelve vacío. */
function esTablaAusente(codigo: string | undefined): boolean {
  return codigo === 'PGRST205' || codigo === '42P01' || codigo === '42703'
}

export async function cuotasDeLaboratorio(laboratorioId: string): Promise<Cuota[]> {
  const admin = createAdminSupabase()
  const { data, error } = await admin
    .from('cuota')
    .select(COLUMNAS)
    .eq('laboratorio_id', laboratorioId)
    .order('periodo_inicio', { ascending: false })
  if (error) {
    if (esTablaAusente(error.code)) return []
    throw new Error(error.message)
  }
  return (data ?? []) as unknown as Cuota[]
}

export async function todasLasCuotas(): Promise<Cuota[]> {
  const admin = createAdminSupabase()
  const { data, error } = await admin
    .from('cuota')
    .select(COLUMNAS)
    .order('periodo_inicio', { ascending: false })
  if (error) {
    if (esTablaAusente(error.code)) return []
    throw new Error(error.message)
  }
  return (data ?? []) as unknown as Cuota[]
}

/**
 * Crea las cuotas que faltan de un laboratorio, hasta hoy.
 *
 * Se llama al abrir el panel en vez de desde una tarea programada: no depende
 * de que un cron se dispare, y el momento en que hace falta saber qué se debe
 * es justo cuando alguien va a mirarlo.
 *
 * Es idempotente por dos vías que se refuerzan: se consultan los periodos ya
 * generados antes de calcular, y la base tiene un índice único por laboratorio
 * y periodo. Si dos renderizados coinciden, el segundo rebota en el índice.
 *
 * **No lanza.** Abrir el panel debe funcionar aunque la generación falle: es
 * peor quedarse sin poder mirar la cobranza que quedarse sin una cuota, que se
 * generará la próxima vez.
 *
 * Devuelve cuántas creó.
 */
export async function generarCuotasFaltantes(lab: CondicionesDeCobro): Promise<number> {
  // Cortesía o condiciones sin definir: no se le cobra nada.
  if (lab.plan === 'gratis') return 0
  if (!lab.inicio_cobro || !lab.periodicidad || lab.precio_cuota === null) return 0

  try {
    const admin = createAdminSupabase()
    const { data: existentes, error } = await admin
      .from('cuota')
      .select('periodo_inicio')
      .eq('laboratorio_id', lab.id)
    if (error) {
      if (esTablaAusente(error.code)) return 0
      throw new Error(error.message)
    }

    const faltantes = periodosFaltantes(
      lab.inicio_cobro,
      lab.periodicidad,
      hoyLima(),
      (existentes ?? []).map((c) => (c as { periodo_inicio: string }).periodo_inicio),
    )
    if (faltantes.length === 0) return 0

    const { error: errInsert } = await admin.from('cuota').insert(
      faltantes.map((p) => ({
        laboratorio_id: lab.id,
        periodo_inicio: p.periodo_inicio,
        periodo_fin: p.periodo_fin,
        vence_el: p.vence_el,
        // La emisión es el inicio del periodo: se cobra por adelantado.
        emitida_el: p.periodo_inicio,
        monto: lab.precio_cuota,
      })),
    )
    // 23505 es el índice único haciendo su trabajo: otra renderización llegó
    // primero. No es un error que haya que contar.
    if (errInsert && errInsert.code !== '23505') throw new Error(errInsert.message)

    return faltantes.length
  } catch (e) {
    registrarError('generarCuotasFaltantes', e, 'no se pudieron generar las cuotas')
    return 0
  }
}

/** Marca una cuota como pagada. */
export async function marcarCuotaPagada(
  id: string,
  datos: { pagada_el: string; medio_pago: string; comprobante: string | null },
): Promise<void> {
  const admin = createAdminSupabase()
  const { error } = await admin
    .from('cuota')
    .update({
      estado: 'pagada',
      pagada_el: datos.pagada_el,
      medio_pago: datos.medio_pago,
      comprobante: datos.comprobante,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Anula una cuota emitida por error.
 *
 * No se borra: una cuota que existió y se anuló es información —explica por qué
 * ese periodo no se cobró— y borrarla dejaría un hueco en la numeración de
 * periodos que nadie podría explicar después.
 */
export async function anularCuota(id: string, nota: string): Promise<void> {
  const admin = createAdminSupabase()
  const { error } = await admin
    .from('cuota')
    .update({ estado: 'anulada', nota })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/** Guarda las condiciones de cobro de un laboratorio. */
export async function guardarCondicionesDeCobro(
  laboratorioId: string,
  datos: {
    plan: 'gratis' | 'pagado'
    periodicidad: Periodicidad
    precio_cuota: number
    inicio_cobro: string | null
  },
): Promise<void> {
  const admin = createAdminSupabase()
  const { error } = await admin
    .from('laboratorio')
    .update({
      plan: datos.plan,
      periodicidad: datos.periodicidad,
      precio_cuota: datos.precio_cuota,
      inicio_cobro: datos.inicio_cobro,
    })
    .eq('id', laboratorioId)
  if (error) throw new Error(error.message)
}
