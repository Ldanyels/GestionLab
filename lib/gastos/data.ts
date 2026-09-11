import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'
import type { CategoriaGasto } from './categorias'
import type { GastoInput } from './schema'

export interface Gasto {
  id: string
  laboratorio_id: string
  categoria: CategoriaGasto
  concepto: string
  monto: number
  fecha: string
  creado_en: string
}

const COLUMNAS = 'id, laboratorio_id, categoria, concepto, monto, fecha, creado_en'

/** Sin la migración 0028 no hay tabla; Finanzas sigue funcionando sin gastos. */
function esTablaAusente(codigo: string | undefined): boolean {
  return codigo === 'PGRST205' || codigo === '42P01'
}

/**
 * Los gastos de un periodo, del más reciente al más antiguo.
 *
 * Devuelve vacío si la tabla no existe todavía. Finanzas es la pantalla que más
 * se mira; que no abra por una migración pendiente sería peor que mostrarla sin
 * los gastos.
 */
export async function gastosDelPeriodo(desde: string, hasta: string): Promise<Gasto[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('gasto')
    .select(COLUMNAS)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: false })
  if (error) {
    if (esTablaAusente(error.code)) return []
    throw new Error(error.message)
  }
  return (data ?? []) as unknown as Gasto[]
}

export async function crearGasto(input: GastoInput): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('gasto').insert({
    ...input,
    laboratorio_id: await laboratorioIdActual(),
  })
  if (error) throw new Error(error.message)
}

export async function editarGasto(id: string, input: GastoInput): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('gasto').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarGasto(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('gasto').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
