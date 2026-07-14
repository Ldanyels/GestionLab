import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'
import { filasConsumoPorReceta } from '@/lib/recetas/data'
import type { Movimiento, Producto, ProductoConMovimientos } from './types'
import { deltaMovimiento, type MovimientoInput, type ProductoInput } from './schema'

export async function listProductos(q?: string): Promise<Producto[]> {
  const supabase = await createServerSupabase()
  let query = supabase.from('producto').select('*')
  if (q?.trim()) query = query.ilike('nombre', `%${q.trim()}%`)
  const { data, error } = await query.order('nombre', { ascending: true })
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

const ETIQUETA_ORIGEN: Record<string, string> = {
  compra: 'Compra',
  ajuste: 'Ajuste de stock',
  otro: 'Otro',
}

export async function registrarMovimiento(
  productoId: string,
  input: MovimientoInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const esIngreso = input.tipo === 'ingreso'
  const costo = esIngreso ? input.costo_unitario : null
  // Para ingresos, si no hay motivo escrito, usa el origen como motivo legible.
  const motivo =
    input.motivo ??
    (esIngreso && input.origen ? ETIQUETA_ORIGEN[input.origen] : null)

  const { error } = await supabase.from('movimiento_inventario').insert({
    laboratorio_id: await laboratorioIdActual(),
    producto_id: productoId,
    tipo: input.tipo,
    cantidad: deltaMovimiento(input),
    costo_unitario: costo,
    motivo,
    ...(input.fecha ? { fecha: input.fecha } : {}),
  })
  if (error) throw new Error(error.message)

  // Si la compra trae costo, actualiza el costo unitario del producto (último precio).
  if (esIngreso && costo !== null && costo > 0) {
    const { error: upErr } = await supabase
      .from('producto')
      .update({ costo_unitario: costo })
      .eq('id', productoId)
    if (upErr) throw new Error(upErr.message)
  }
}

export async function eliminarMovimiento(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('movimiento_inventario').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Liquidación: ajusta el stock de un producto a su conteo físico real.
 * La diferencia (real − teórico) se registra como 'merma' (si falta) o 'ajuste' (si sobra).
 */
export async function liquidarProducto(
  productoId: string,
  conteoReal: number,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { data: p } = await supabase
    .from('producto')
    .select('stock_actual')
    .eq('id', productoId)
    .maybeSingle()
  if (!p) return
  const teorico = (p as { stock_actual: number }).stock_actual
  const delta = Math.round((conteoReal - teorico) * 1000) / 1000
  if (delta === 0) return
  const { error } = await supabase.from('movimiento_inventario').insert({
    laboratorio_id: await laboratorioIdActual(),
    producto_id: productoId,
    tipo: delta < 0 ? 'merma' : 'ajuste',
    cantidad: delta,
    motivo: 'Liquidación',
  })
  if (error) throw new Error(error.message)
}

/** Costo de insumos consumidos por un trabajo (salidas valorizadas a costo del producto). */
export async function costoInsumosPorTrabajo(trabajoId: string): Promise<number> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('movimiento_inventario')
    .select('cantidad, producto:producto_id(costo_unitario)')
    .eq('trabajo_id', trabajoId)
    .eq('tipo', 'salida')
  if (error) return 0
  type Row = { cantidad: number; producto: { costo_unitario: number } | null }
  return (data as unknown as Row[]).reduce(
    (s, m) => s + Math.abs(m.cantidad) * (m.producto?.costo_unitario ?? 0),
    0,
  )
}

/**
 * Descuenta del stock los insumos de la receta del trabajo (una sola vez).
 * Idempotente: si ya existen salidas ligadas a este trabajo, no hace nada.
 */
export async function descontarInsumosPorTrabajo(trabajoId: string): Promise<void> {
  const supabase = await createServerSupabase()

  const { count } = await supabase
    .from('movimiento_inventario')
    .select('id', { count: 'exact', head: true })
    .eq('trabajo_id', trabajoId)
    .eq('tipo', 'salida')
  if ((count ?? 0) > 0) return // ya se descontó

  const { data: trabajo } = await supabase
    .from('trabajo')
    .select('catalogo_trabajo_id')
    .eq('id', trabajoId)
    .maybeSingle()
  if (!trabajo) return

  const { data: recetas } = await supabase
    .from('receta')
    .select('producto_id, cantidad')
    .eq('catalogo_trabajo_id', (trabajo as { catalogo_trabajo_id: string }).catalogo_trabajo_id)
  if (!recetas || recetas.length === 0) return

  const filas = filasConsumoPorReceta(recetas as { producto_id: string; cantidad: number }[], {
    laboratorioId: await laboratorioIdActual(),
    trabajoId,
  })
  const { error } = await supabase.from('movimiento_inventario').insert(filas)
  if (error) throw new Error(error.message)
}
