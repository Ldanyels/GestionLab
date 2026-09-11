import { createAdminSupabase } from '@/lib/supabase/admin'
import { erroresRegistrados } from '@/lib/errores-registrados/data'
import { sumarDias } from '@/lib/fechas'
import { hoyLima } from '@/lib/trabajos/agenda'
import type { MetricaDeLaboratorio } from './metricas'

/**
 * Reúne las métricas de todos los laboratorios.
 *
 * Tres consultas en total, no tres por laboratorio: la función de la base
 * devuelve una fila por cliente con todos sus conteos. Con veinte clientes,
 * preguntar cinco cosas a cada uno serían cien viajes para pintar una pantalla.
 */

/** Sin la migración 0032 el panel sigue abriendo, con las métricas vacías. */
function esFuncionAusente(codigo: string | undefined): boolean {
  return codigo === 'PGRST202' || codigo === '42883' || codigo === 'PGRST205'
}

export async function metricasDeLaboratorios(): Promise<MetricaDeLaboratorio[]> {
  const admin = createAdminSupabase()
  const hoy = hoyLima()

  const [labs, filas, errores] = await Promise.all([
    admin.from('laboratorio').select('id, nombre, plan, estado, precio_cuota, periodicidad'),
    admin.rpc('metricas_laboratorios', {
      p_desde_7: sumarDias(hoy, -7),
      p_desde_14: sumarDias(hoy, -14),
      // Desde el día 1 del mes en curso.
      p_desde_mes: `${hoy.slice(0, 7)}-01`,
    }),
    erroresRegistrados(200),
  ])

  if (labs.error) throw new Error(labs.error.message)
  if (filas.error && !esFuncionAusente(filas.error.code)) {
    throw new Error(filas.error.message)
  }

  type Conteos = {
    laboratorio_id: string
    trabajos_7: number
    trabajos_previos_7: number
    trabajos_mes: number
    trabajos_total: number
    ultimo_trabajo: string | null
    fotos: number
    accesos_soporte: number
  }
  const porId = new Map(
    ((filas.data ?? []) as Conteos[]).map((f) => [f.laboratorio_id, f]),
  )

  /*
    Los errores se cuentan aquí y no en la función de la base.

    `error_registrado` guarda los laboratorios afectados en un arreglo, y
    contarlos en SQL obligaría a desplegarlo por cada fila. Son unas decenas de
    filas y se leen de todos modos para el aviso del panel, así que sale más
    barato recorrerlas una vez en memoria.
  */
  const erroresPorLab = new Map<string, number>()
  for (const e of errores) {
    if (e.resuelto_el) continue
    for (const id of e.laboratorios) {
      erroresPorLab.set(id, (erroresPorLab.get(id) ?? 0) + 1)
    }
  }

  type Lab = {
    id: string
    nombre: string
    plan: string
    estado: string
    precio_cuota: number | null
    periodicidad: string | null
  }

  return ((labs.data ?? []) as Lab[]).map((l) => {
    const c = porId.get(l.id)
    return {
      laboratorio_id: l.id,
      nombre: l.nombre,
      plan: l.plan,
      estado: l.estado,
      precio_cuota: l.precio_cuota,
      periodicidad: l.periodicidad,
      trabajos_7: Number(c?.trabajos_7 ?? 0),
      trabajos_previos_7: Number(c?.trabajos_previos_7 ?? 0),
      trabajos_mes: Number(c?.trabajos_mes ?? 0),
      trabajos_total: Number(c?.trabajos_total ?? 0),
      ultimo_trabajo: c?.ultimo_trabajo ?? null,
      fotos: Number(c?.fotos ?? 0),
      accesos_soporte: Number(c?.accesos_soporte ?? 0),
      errores: erroresPorLab.get(l.id) ?? 0,
    }
  })
}
