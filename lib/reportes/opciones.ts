import { createServerSupabase } from '@/lib/supabase/server'

export interface ConsultorioOpcion {
  id: string
  nombre: string
}

export interface DoctorOpcion {
  id: string
  nombre: string
  consultorio_id: string
}

/** Consultorios y doctores activos, para los filtros del reporte. */
export async function opcionesFiltro(): Promise<{
  consultorios: ConsultorioOpcion[]
  doctores: DoctorOpcion[]
}> {
  const supabase = await createServerSupabase()
  const [c, d] = await Promise.all([
    supabase.from('consultorio').select('id, nombre').eq('activo', true).order('nombre'),
    supabase
      .from('doctor')
      .select('id, nombre, consultorio_id')
      .eq('activo', true)
      .order('nombre'),
  ])
  return {
    consultorios: (c.data ?? []) as ConsultorioOpcion[],
    doctores: (d.data ?? []) as DoctorOpcion[],
  }
}
