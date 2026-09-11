import { createServerSupabase } from '@/lib/supabase/server'
import { armarResumen, type ResumenFinanciero } from './calculo'
import { gastosDelPeriodo } from '@/lib/gastos/data'
// Se reexporta para no romper a quien ya la importaba de aquí.
export { rangoMesActual } from './mes'

export interface PuntoMes {
  mes: string
  ingresos: number
  gastos: number
}

export interface RankingItem {
  consultorio: string
  ingreso: number
}

export interface ConsumoItem {
  producto: string
  cantidad: number
  costo: number
}

export interface CuentaConsultorio {
  consultorio: string
  facturado: number
  pagado: number
  saldo: number
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
  /*
    Los gastos se leen aparte y no dentro de `finanzas_resumen`.

    La función de la base ya calcula ingresos, materiales y pagos; tocarla para
    añadir una tabla nueva significaría reemplazarla por migración y arriesgar
    las tres cifras que ya funcionan. La tabla de gastos tiene unas decenas de
    filas por mes, así que la consulta extra no se nota.
  */
  const gastos = await gastosDelPeriodo(desde, hasta)
  const operativos =
    Math.round(gastos.reduce((s, g) => s + Number(g.monto), 0) * 100) / 100

  return armarResumen({
    ingresos: Number(row.ingresos),
    materiales: Number(row.materiales),
    pagos: Number(row.pagos),
    operativos,
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

export async function estadoCuentaConsultorios(): Promise<CuentaConsultorio[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('estado_cuenta_consultorios')
  if (error) return []
  return (data ?? []).map(
    (r: { consultorio: string; facturado: number; pagado: number; saldo: number }) => ({
      consultorio: r.consultorio,
      facturado: Number(r.facturado),
      pagado: Number(r.pagado),
      saldo: Number(r.saldo),
    }),
  )
}

export async function consumoPorProducto(
  desde: string,
  hasta: string,
): Promise<ConsumoItem[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('consumo_por_producto', {
    p_desde: desde,
    p_hasta: hasta,
  })
  // Si la función aún no existe (migración 0009 pendiente), no rompas Finanzas.
  if (error) return []
  return (data ?? []).map(
    (r: { producto: string; cantidad: number; costo: number }) => ({
      producto: r.producto,
      cantidad: Number(r.cantidad),
      costo: Number(r.costo),
    }),
  )
}
