import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'
import { precioEfectivo } from '@/lib/catalogo/precio'
import type { EstadoEtapa, EstadoTrabajo } from './estado'
import type {
  Trabajo,
  TrabajoDetalle,
  TrabajoEtapa,
  TrabajoListItem,
} from './types'
import type { TrabajoInput } from './schema'

const SELECT_LIST =
  '*, doctor:doctor_id(nombre, consultorio:consultorio_id(nombre)), catalogo:catalogo_trabajo_id(nombre, categoria, variable_etiqueta)'

type Joined = Trabajo & {
  doctor: { nombre: string; consultorio: { nombre: string } | null } | null
  catalogo: { nombre: string; categoria: string; variable_etiqueta: string | null } | null
}

function aListItem(row: Joined): TrabajoListItem {
  return {
    ...row,
    doctor_nombre: row.doctor?.nombre ?? '—',
    consultorio_nombre: row.doctor?.consultorio?.nombre ?? '—',
    tipo_nombre: row.catalogo?.nombre ?? '—',
  }
}

export async function listTrabajos(
  estado?: EstadoTrabajo,
): Promise<TrabajoListItem[]> {
  const supabase = await createServerSupabase()
  let query = supabase.from('trabajo').select(SELECT_LIST)
  if (estado) query = query.eq('estado', estado)
  const { data, error } = await query
    .order('fecha_ingreso', { ascending: false })
    .order('creado_en', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as Joined[]).map(aListItem)
}

export async function getTrabajo(id: string): Promise<TrabajoDetalle | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('trabajo')
    .select(`${SELECT_LIST}, etapas:trabajo_etapa(*)`)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const row = data as unknown as Joined & { etapas: TrabajoEtapa[] }
  const etapas = [...(row.etapas ?? [])].sort((a, b) => a.orden - b.orden)
  return {
    ...aListItem(row),
    variable_etiqueta: row.catalogo?.variable_etiqueta ?? null,
    etapas,
  }
}

/** Crea un trabajo, calcula el precio y copia las etapas de la plantilla. */
export async function crearTrabajo(input: TrabajoInput): Promise<string> {
  const supabase = await createServerSupabase()
  const laboratorioId = await laboratorioIdActual()

  const { data: cat, error: catErr } = await supabase
    .from('catalogo_trabajo')
    .select('precio_base, variable_precio_unitario')
    .eq('id', input.catalogo_trabajo_id)
    .maybeSingle()
  if (catErr) throw new Error(catErr.message)
  if (!cat) throw new Error('Tipo de trabajo no encontrado')

  const precio =
    input.precio_manual ??
    precioEfectivo(
      {
        precio_base: cat.precio_base,
        variable_precio_unitario: cat.variable_precio_unitario,
      },
      input.variable_cantidad,
    )

  const { data: nuevo, error } = await supabase
    .from('trabajo')
    .insert({
      laboratorio_id: laboratorioId,
      doctor_id: input.doctor_id,
      catalogo_trabajo_id: input.catalogo_trabajo_id,
      paciente_nombre: input.paciente_nombre,
      fecha_entrega: input.fecha_entrega,
      variable_cantidad: input.variable_cantidad,
      precio_acordado: precio,
      notas: input.notas,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  const trabajoId = (nuevo as { id: string }).id

  // Copiar etapas de la plantilla del tipo
  const { data: plantilla } = await supabase
    .from('plantilla_etapa')
    .select('nombre, orden')
    .eq('catalogo_trabajo_id', input.catalogo_trabajo_id)
    .order('orden', { ascending: true })

  if (plantilla && plantilla.length > 0) {
    const filas = (plantilla as { nombre: string; orden: number }[]).map((e) => ({
      laboratorio_id: laboratorioId,
      trabajo_id: trabajoId,
      nombre: e.nombre,
      orden: e.orden,
      estado: 'pendiente' as EstadoEtapa,
    }))
    const { error: eErr } = await supabase.from('trabajo_etapa').insert(filas)
    if (eErr) throw new Error(eErr.message)
  }

  return trabajoId
}

export async function editarTrabajo(
  id: string,
  input: TrabajoInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { data: cat } = await supabase
    .from('catalogo_trabajo')
    .select('precio_base, variable_precio_unitario')
    .eq('id', input.catalogo_trabajo_id)
    .maybeSingle()
  const precio =
    input.precio_manual ??
    precioEfectivo(
      {
        precio_base: cat?.precio_base ?? 0,
        variable_precio_unitario: cat?.variable_precio_unitario ?? null,
      },
      input.variable_cantidad,
    )
  const { error } = await supabase
    .from('trabajo')
    .update({
      doctor_id: input.doctor_id,
      paciente_nombre: input.paciente_nombre,
      fecha_entrega: input.fecha_entrega,
      variable_cantidad: input.variable_cantidad,
      precio_acordado: precio,
      notas: input.notas,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarTrabajo(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('trabajo').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function cambiarEstadoTrabajo(
  id: string,
  estado: EstadoTrabajo,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('trabajo').update({ estado }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function marcarEtapa(
  id: string,
  estado: EstadoEtapa,
  motivo?: string | null,
): Promise<void> {
  const supabase = await createServerSupabase()
  const cerrada = estado === 'completada' || estado === 'excluida'
  const { error } = await supabase
    .from('trabajo_etapa')
    .update({
      estado,
      motivo_exclusion: estado === 'excluida' ? (motivo ?? null) : null,
      fecha_cierre: cerrada ? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
