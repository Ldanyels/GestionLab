import { createServerSupabase } from '@/lib/supabase/server'
import { resumenItems } from '@/lib/trabajos/resumen'
import type { FilaReporte } from './agrupar'

export interface FiltrosReporte {
  desde?: string
  hasta?: string
  consultorioId?: string
  doctorId?: string
}

type Row = {
  id: string
  fecha_ingreso: string
  estado: string
  paciente_nombre: string | null
  precio_acordado: number
  doctor: {
    id: string
    nombre: string
    consultorio_id: string
    consultorio: { id: string; nombre: string } | null
  } | null
  abonos: { monto: number }[] | null
  items:
    | { cantidad: number; orden: number; catalogo: { nombre: string } | null }[]
    | null
}

/** Trabajos (con pagos y resumen de líneas) filtrados por rango, consultorio o doctor. */
export async function filasReporte(f: FiltrosReporte = {}): Promise<FilaReporte[]> {
  const supabase = await createServerSupabase()
  let q = supabase
    .from('trabajo')
    .select(
      'id, fecha_ingreso, estado, paciente_nombre, precio_acordado, doctor:doctor_id!inner(id, nombre, consultorio_id, consultorio:consultorio_id(id, nombre)), abonos:abono(monto), items:trabajo_item(cantidad, orden, catalogo:catalogo_trabajo_id(nombre))',
    )
  if (f.desde) q = q.gte('fecha_ingreso', f.desde)
  if (f.hasta) q = q.lte('fecha_ingreso', f.hasta)
  if (f.doctorId) q = q.eq('doctor_id', f.doctorId)
  if (f.consultorioId) q = q.eq('doctor.consultorio_id', f.consultorioId)
  const { data, error } = await q.order('fecha_ingreso', { ascending: true })
  if (error) throw new Error(error.message)

  return (data as unknown as Row[]).map((r) => {
    const items = [...(r.items ?? [])].sort((a, b) => a.orden - b.orden)
    const pagado = (r.abonos ?? []).reduce((s, a) => s + a.monto, 0)
    return {
      id: r.id,
      fecha_ingreso: r.fecha_ingreso,
      estado: r.estado,
      paciente: r.paciente_nombre,
      resumen:
        items.length > 0
          ? resumenItems(
              items.map((i) => ({ cantidad: i.cantidad, nombre: i.catalogo?.nombre ?? '—' })),
            )
          : '—',
      total: r.precio_acordado,
      pagado: Math.round(pagado * 100) / 100,
      doctor_id: r.doctor?.id ?? '',
      doctor: r.doctor?.nombre ?? '—',
      consultorio_id: r.doctor?.consultorio?.id ?? '',
      consultorio: r.doctor?.consultorio?.nombre ?? '—',
    }
  })
}
