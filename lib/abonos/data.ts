import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'
import type { Abono } from './types'
import type { AbonoInput } from './schema'

export async function listAbonos(trabajoId: string): Promise<Abono[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('abono')
    .select('*')
    .eq('trabajo_id', trabajoId)
    .order('fecha', { ascending: true })
    .order('creado_en', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Abono[]
}

export async function crearAbono(
  trabajoId: string,
  input: AbonoInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('abono').insert({
    trabajo_id: trabajoId,
    laboratorio_id: await laboratorioIdActual(),
    monto: input.monto,
    metodo: input.metodo,
    ...(input.fecha ? { fecha: input.fecha } : {}),
    nota: input.nota,
  })
  if (error) throw new Error(error.message)
}

export async function eliminarAbono(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('abono').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
