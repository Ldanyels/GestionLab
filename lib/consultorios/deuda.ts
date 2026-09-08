import { createServerSupabase } from '@/lib/supabase/server'
import { filasReporte } from '@/lib/reportes/data'
import { agruparPorConsultorio } from '@/lib/reportes/agrupar'

export interface DeudaConsultorio {
  consultorio_id: string
  consultorio: string
  doctores: number
  trabajos: number
  facturado: number
  pagado: number
  saldo: number
}

/**
 * Deuda por consultorio, agregada por la base (migración 0017).
 *
 * Si la función aún no existe, se calcula en memoria a partir de los
 * trabajos: es más costoso, pero una migración pendiente no debe dejar la
 * pantalla sin datos ni mostrar deuda cero, que sería engañoso.
 */
export async function deudaPorConsultorio(): Promise<DeudaConsultorio[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('deuda_por_consultorio')

  if (!error) {
    return (data ?? []).map(
      (r: {
        consultorio_id: string
        consultorio: string
        doctores: number
        trabajos: number
        facturado: number
        pagado: number
        saldo: number
      }) => ({
        consultorio_id: r.consultorio_id,
        consultorio: r.consultorio,
        doctores: Number(r.doctores),
        trabajos: Number(r.trabajos),
        facturado: Number(r.facturado),
        pagado: Number(r.pagado),
        saldo: Number(r.saldo),
      }),
    )
  }

  console.warn(
    '[deudaPorConsultorio] falta deuda_por_consultorio (migración 0017 pendiente); se calcula en memoria',
  )
  const { grupos } = agruparPorConsultorio(await filasReporte())
  return grupos.map((g) => ({
    consultorio_id: g.consultorio_id,
    consultorio: g.consultorio,
    doctores: g.doctores.length,
    trabajos: g.doctores.reduce((s, d) => s + d.filas.length, 0),
    facturado: g.facturado,
    pagado: g.pagado,
    saldo: g.saldo,
  }))
}
