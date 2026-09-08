'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { intentar, intentarSinEstado } from '@/lib/acciones'
import { requireAdmin, requirePermiso } from '@/lib/auth'
import { veMontos } from '@/lib/permisos'
import { productoSchema, movimientoSchema } from '@/lib/inventario/schema'
import {
  crearProducto,
  editarProducto,
  eliminarProducto,
  registrarMovimiento,
  eliminarMovimiento,
  liquidarProducto,
  archivarProducto,
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

  const r = await intentar('crearProductoAction', 'No se pudo guardar el insumo', () =>
    crearProducto(parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath('/inventario')
  redirect(`/inventario/${r.valor}`)
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

  const r = await intentar('editarProductoAction', 'No se pudieron guardar los cambios', () =>
    editarProducto(id, parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath('/inventario')
  revalidatePath(`/inventario/${id}`)
  redirect(`/inventario/${id}`)
}

export async function eliminarProductoAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await intentarSinEstado('eliminarProductoAction', 'No se pudo eliminar el insumo', () =>
    eliminarProducto(id),
  )

  revalidatePath('/inventario')
  redirect('/inventario')
}

export async function registrarMovimientoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const perfil = await requirePermiso('inventario_editar')
  const productoId = String(formData.get('producto_id') ?? '')
  if (!productoId) return { error: 'Falta el producto' }
  const parsed = movimientoSchema.safeParse({
    tipo: String(formData.get('tipo') ?? ''),
    cantidad: String(formData.get('cantidad') ?? ''),
    ajuste_resta: formData.get('ajuste_resta') === 'on',
    origen: String(formData.get('origen') ?? '') || undefined,
    // Solo el admin fija costos: al técnico se le ignora este campo.
    costo_unitario: veMontos(perfil) ? String(formData.get('costo_unitario') ?? '') : '',
    motivo: String(formData.get('motivo') ?? ''),
    fecha: String(formData.get('fecha') ?? ''),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const r = await intentar('registrarMovimientoAction', 'No se pudo registrar el movimiento', () =>
    registrarMovimiento(productoId, parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath(`/inventario/${productoId}`)
  revalidatePath('/inventario')
  return { error: '' }
}

export async function eliminarMovimientoAction(formData: FormData): Promise<void> {
  await requirePermiso('inventario_editar')
  const id = String(formData.get('id') ?? '')
  const productoId = String(formData.get('producto_id') ?? '')
  if (!id) return

  await intentarSinEstado('eliminarMovimientoAction', 'No se pudo eliminar el movimiento', () =>
    eliminarMovimiento(id),
  )

  if (productoId) {
    revalidatePath(`/inventario/${productoId}`)
    revalidatePath('/inventario')
  }
}

export async function archivarProductoAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const activo = String(formData.get('activo') ?? '') === 'true'
  if (!id) return

  await intentarSinEstado(
    'archivarProductoAction',
    activo ? 'No se pudo reactivar el insumo' : 'No se pudo archivar el insumo',
    () => archivarProducto(id, activo),
  )

  revalidatePath('/inventario')
  revalidatePath(`/inventario/${id}`)
  redirect(activo ? `/inventario/${id}` : '/inventario')
}

export async function liquidarProductoAction(formData: FormData): Promise<void> {
  await requirePermiso('inventario_editar')
  const productoId = String(formData.get('producto_id') ?? '')
  const conteo = Number(formData.get('conteo_real'))
  if (!productoId || Number.isNaN(conteo) || conteo < 0) return

  await intentarSinEstado('liquidarProductoAction', 'No se pudo registrar la liquidación', () =>
    liquidarProducto(productoId, conteo),
  )

  revalidatePath('/inventario/liquidacion')
  revalidatePath('/inventario')
}
