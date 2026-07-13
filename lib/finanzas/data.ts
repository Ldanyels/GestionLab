import { createServerSupabase } from '@/lib/supabase/server'
import { armarResumen, type ResumenFinanciero } from './calculo'

export interface PuntoMes {
  mes: string
  ingresos: number
  gastos: number
}

export interface RankingItem {
  consultorio: string
  ingreso: number
}

function fmtFecha(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/** Rango [desde, hasta] del mes actual (fechas locales YYYY-MM-DD). */
export function rangoMesActual(): { desde: string; hasta: string } {
  const now = new Date()
  const desde = new Date(now.getFullYear(), now.getMonth(), 1)
  const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { desde: fmtFecha(desde), hasta: fmtFecha(hasta) }
}

export async function resumen(
  desde: string,
  hasta: string,
): Promise<ResumenFinanciero> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .rpc('finanzas_resumen', { p_desde: desde, p_hasta: hasta })
    .maybeSingle()
  if (error) throw new Error(error.message)
  const row = (data ?? { ingresos: 0, materiales: 0, pagos: 0 }) as {
    ingresos: number
    materiales: number
    pagos: number
  }
  return armarResumen({
    ingresos: Number(row.ingresos),
    materiales: Number(row.materiales),
    pagos: Number(row.pagos),
  })
}

export async function porMes(meses: number): Promise<PuntoMes[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('finanzas_por_mes', { p_meses: meses })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: { mes: string; ingresos: number; gastos: number }) => ({
    mes: r.mes,
    ingresos: Number(r.ingresos),
    gastos: Number(r.gastos),
  }))
}

export async function rankingConsultorios(
  desde: string,
  hasta: string,
): Promise<RankingItem[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('ranking_consultorios', {
    p_desde: desde,
    p_hasta: hasta,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: { consultorio: string; ingreso: number }) => ({
    consultorio: r.consultorio,
    ingreso: Number(r.ingreso),
  }))
}
