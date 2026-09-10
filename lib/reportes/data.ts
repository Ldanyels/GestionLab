import { createServerSupabase } from '@/lib/supabase/server'
import { resumenItems } from '@/lib/trabajos/resumen'
import type { EstadoTrabajo } from '@/lib/trabajos/estado'
import type { FilaReporte } from './agrupar'

export interface FiltrosReporte {
  desde?: string
  hasta?: string
  consultorioId?: string
  doctorId?: string
  /** Un solo estado, o todos si va vacío. */
  estado?: EstadoTrabajo
  /**
   * Columna de fecha que acotan `desde` y `hasta`.
   *
   * Sobre entregados es `entregado_el`, y eso responde «qué entregamos este
   * mes». Acotar por esa columna descarta en la propia consulta los trabajos
   * sin fecha de entrega —los entregados antes de la migración 0019—, que es
   * el comportamiento correcto: no consta cuándo salieron.
   */
  campoFecha?: 'fecha_ingreso' | 'entregado_el'
}

type Row = {
  id: string
  fecha_ingreso: string
  entregado_el: string | null
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
      'id, fecha_ingreso, entregado_el, estado, paciente_nombre, precio_acordado, doctor:doctor_id!inner(id, nombre, consultorio_id, consultorio:consultorio_id(id, nombre)), abonos:abono(monto), items:trabajo_item(cantidad, orden, catalogo:catalogo_trabajo_id(nombre))',
    )
  const campo = f.campoFecha ?? 'fecha_ingreso'
  if (campo === 'entregado_el') {
    /*
      Al acotar por fecha de salida se incluyen también los entregados que no
      la tienen registrada. Se entregaron antes de que el sistema la guardara,
      así que no consta cuándo salieron, y descartarlos hacía que «Entregados»
      perdiera trabajos en silencio: el conteo decía 16 y la lista mostraba 4.
      Se prefiere contarlos a inventarles una fecha que nadie registró.

      La consecuencia asumida: un trabajo sin fecha entregado en julio también
      aparece en el recorte de septiembre. Es inevitable sin el dato, y va
      desapareciendo por su cuenta: todo lo que se entrega desde ahora sí la
      lleva.
    */
    const dentro = [
      f.desde ? `entregado_el.gte.${f.desde}` : null,
      f.hasta ? `entregado_el.lte.${f.hasta}` : null,
    ].filter(Boolean)
    q =
      dentro.length > 0
        ? q.or(`entregado_el.is.null,and(${dentro.join(',')})`)
        : q
  } else {
    if (f.desde) q = q.gte(campo, f.desde)
    if (f.hasta) q = q.lte(campo, f.hasta)
  }
  if (f.estado) q = q.eq('estado', f.estado)
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
      entregado_el: r.entregado_el,
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
