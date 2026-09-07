import { getSessionContext } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'

/** Id del laboratorio del usuario autenticado (para escrituras). */
export async function laboratorioIdActual(): Promise<string> {
  const { perfil } = await getSessionContext()
  if (!perfil) throw new Error('Sesión sin perfil')
  return perfil.laboratorio_id
}

/** Nombre del laboratorio del usuario autenticado (encabezados, recibos). */
export async function nombreLaboratorioActual(): Promise<string> {
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('laboratorio')
    .select('nombre')
    .eq('id', await laboratorioIdActual())
    .maybeSingle()
  return (data as { nombre: string } | null)?.nombre ?? 'Laboratorio'
}
