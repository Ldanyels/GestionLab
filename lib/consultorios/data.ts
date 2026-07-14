import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'
import type { Consultorio, ConsultorioConDoctores, Doctor } from './types'
import type { ConsultorioInput, DoctorInput } from './schema'

/** Lista los consultorios del laboratorio actual (RLS los filtra), con búsqueda opcional. */
export async function listConsultorios(q?: string): Promise<Consultorio[]> {
  const supabase = await createServerSupabase()
  let query = supabase.from('consultorio').select('*')
  if (q?.trim()) query = query.ilike('nombre', `%${q.trim()}%`)
  const { data, error } = await query.order('nombre', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Consultorio[]
}

/** Devuelve un consultorio con sus doctores, o null si no existe/no visible. */
export async function getConsultorio(
  id: string,
): Promise<ConsultorioConDoctores | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('consultorio')
    .select('*, doctores:doctor(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const row = data as Consultorio & { doctores: Doctor[] }
  return { ...row, doctores: row.doctores ?? [] }
}

export interface DoctorOpcion {
  id: string
  nombre: string
  consultorio_nombre: string
}

/** Doctores del laboratorio con el nombre de su consultorio, para selectores. */
export async function listDoctoresConConsultorio(): Promise<DoctorOpcion[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('doctor')
    .select('id, nombre, consultorio:consultorio_id(nombre)')
    .order('nombre', { ascending: true })
  if (error) throw new Error(error.message)
  type Row = { id: string; nombre: string; consultorio: { nombre: string } | null }
  return (data as unknown as Row[]).map((d) => ({
    id: d.id,
    nombre: d.nombre,
    consultorio_nombre: d.consultorio?.nombre ?? '—',
  }))
}

export async function crearConsultorio(input: ConsultorioInput): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from('consultorio')
    .insert({ ...input, laboratorio_id: await laboratorioIdActual() })
  if (error) throw new Error(error.message)
}

export async function editarConsultorio(
  id: string,
  input: ConsultorioInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('consultorio').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarConsultorio(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('consultorio').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function crearDoctor(
  consultorioId: string,
  input: DoctorInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('doctor').insert({
    ...input,
    consultorio_id: consultorioId,
    laboratorio_id: await laboratorioIdActual(),
  })
  if (error) throw new Error(error.message)
}

export async function editarDoctor(
  id: string,
  input: DoctorInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('doctor').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarDoctor(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('doctor').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
