'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { productoSchema, movimientoSchema } from '@/lib/inventario/schema'
import {
  crearProducto,
  editarProducto,
  eliminarProducto,
  registrarMovimiento,
  eliminarMovimiento,
} from '@/lib/inventario/data'

export interface FormState {
  error: string
}

function leerProducto(formData: FormData) {
  return productoSchema.safeParse({
    nombre: String(formData.get('nombre') ?? ''),
    unidad: String(formData.get('unidad') ?? 'unidad'),
    stock_minimo: String(formData.get('stock_minimo') ?? '0'),
    costo_unitario: String(formData.get('costo_unitario') ?? '0'),
    stock_inicial: String(formData.get('stock_inicial') ?? '0'),
  })
}

export async function crearProductoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const parsed = leerProducto(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  const id = await crearProducto(parsed.data)
  revalidatePath('/inventario')
  redirect(`/inventario/${id}`)
}

export async function editarProductoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const parsed = leerProducto(formData)
  if (!id) return { error: 'Falta el identificador' }
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  await editarProducto(id, parsed.data)
  revalidatePath('/inventario')
  revalidatePath(`/inventario/${id}`)
  redirect(`/inventario/${id}`)
}

export async function eliminarProductoAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await eliminarProducto(id)
  revalidatePath('/inventario')
  redirect('/inventario')
}

export async function registrarMovimientoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const productoId = String(formData.get('producto_id') ?? '')
  if (!productoId) return { error: 'Falta el producto' }
  const parsed = movimientoSchema.safeParse({
    tipo: String(formData.get('tipo') ?? ''),
    cantidad: String(formData.get('cantidad') ?? ''),
    ajuste_resta: formData.get('ajuste_resta') === 'on',
    motivo: String(formData.get('motivo') ?? ''),
    fecha: String(formData.get('fecha') ?? ''),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  await registrarMovimiento(productoId, parsed.data)
  revalidatePath(`/inventario/${productoId}`)
  revalidatePath('/inventario')
  return { error: '' }
}

export async function eliminarMovimientoAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const productoId = String(formData.get('producto_id') ?? '')
  if (!id) return
  await eliminarMovimiento(id)
  if (productoId) {
    revalidatePath(`/inventario/${productoId}`)
    revalidatePath('/inventario')
  }
}
