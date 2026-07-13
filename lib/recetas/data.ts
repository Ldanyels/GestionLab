import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'

export const recetaSchema = z.object({
  producto_id: z.string().uuid('Selecciona un insumo'),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
})
export type RecetaInput = z.infer<typeof recetaSchema>

export interface RecetaItem {
  id: string
  producto_id: string
  cantidad: number
  producto_nombre: string
  unidad: string
}

/** Salida (delta con signo) que genera cada insumo de una receta. Puro y testeable. */
export function filasConsumoPorReceta(
  recetas: ReadonlyArray<{ producto_id: string; cantidad: number }>,
  ctx: { laboratorioId: string; trabajoId: string },
): Array<{
  laboratorio_id: string
  producto_id: string
  trabajo_id: string
  tipo: 'salida'
  cantidad: number
  motivo: string
}> {
  return recetas.map((r) => ({
    laboratorio_id: ctx.laboratorioId,
    producto_id: r.producto_id,
    trabajo_id: ctx.trabajoId,
    tipo: 'salida',
    cantidad: -Math.abs(r.cantidad),
    motivo: 'Consumo por trabajo',
  }))
}

export async function listReceta(catalogoId: string): Promise<RecetaItem[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('receta')
    .select('id, producto_id, cantidad, producto:producto_id(nombre, unidad)')
    .eq('catalogo_trabajo_id', catalogoId)
  if (error) throw new Error(error.message)
  type Row = {
    id: string
    producto_id: string
    cantidad: number
    producto: { nombre: string; unidad: string } | null
  }
  return (data as unknown as Row[])
    .map((r) => ({
      id: r.id,
      producto_id: r.producto_id,
      cantidad: r.cantidad,
      producto_nombre: r.producto?.nombre ?? '—',
      unidad: r.producto?.unidad ?? '',
    }))
    .sort((a, b) => a.producto_nombre.localeCompare(b.producto_nombre))
}

export async function agregarReceta(
  catalogoId: string,
  input: RecetaInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('receta').insert({
    laboratorio_id: await laboratorioIdActual(),
    catalogo_trabajo_id: catalogoId,
    producto_id: input.producto_id,
    cantidad: input.cantidad,
  })
  if (error) throw new Error(error.message)
}

export async function editarReceta(id: string, cantidad: number): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('receta').update({ cantidad }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarReceta(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('receta').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
