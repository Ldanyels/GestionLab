import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'
import type { Movimiento, Producto, ProductoConMovimientos } from './types'
import { deltaMovimiento, type MovimientoInput, type ProductoInput } from './schema'

export async function listProductos(): Promise<Producto[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('producto')
    .select('*')
    .order('nombre', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Producto[]
}

export async function getProducto(
  id: string,
): Promise<ProductoConMovimientos | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('producto')
    .select('*, movimientos:movimiento_inventario(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const row = data as Producto & { movimientos: Movimiento[] }
  const movimientos = [...(row.movimientos ?? [])].sort((a, b) =>
    b.creado_en.localeCompare(a.creado_en),
  )
  return { ...row, movimientos }
}

export async function crearProducto(input: ProductoInput): Promise<string> {
  const supabase = await createServerSupabase()
  const laboratorioId = await laboratorioIdActual()
  const { data, error } = await supabase
    .from('producto')
    .insert({
      laboratorio_id: laboratorioId,
      nombre: input.nombre,
      unidad: input.unidad,
      stock_minimo: input.stock_minimo,
      costo_unitario: input.costo_unitario,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  const id = (data as { id: string }).id

  if (input.stock_inicial > 0) {
    const { error: movErr } = await supabase.from('movimiento_inventario').insert({
      laboratorio_id: laboratorioId,
      producto_id: id,
      tipo: 'ingreso',
      cantidad: input.stock_inicial,
      motivo: 'Stock inicial',
    })
    if (movErr) throw new Error(movErr.message)
  }
  return id
}

export async function editarProducto(
  id: string,
  input: ProductoInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from('producto')
    .update({
      nombre: input.nombre,
      unidad: input.unidad,
      stock_minimo: input.stock_minimo,
      costo_unitario: input.costo_unitario,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarProducto(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('producto').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function registrarMovimiento(
  productoId: string,
  input: MovimientoInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('movimiento_inventario').insert({
    laboratorio_id: await laboratorioIdActual(),
    producto_id: productoId,
    tipo: input.tipo,
    cantidad: deltaMovimiento(input),
    motivo: input.motivo,
    ...(input.fecha ? { fecha: input.fecha } : {}),
  })
  if (error) throw new Error(error.message)
}

export async function eliminarMovimiento(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('movimiento_inventario').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
