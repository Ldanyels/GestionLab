'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { catalogoSchema, etapaSchema } from '@/lib/catalogo/schema'
import {
  crearCatalogo,
  editarCatalogo,
  eliminarCatalogo,
  crearEtapa,
  editarEtapa,
  eliminarEtapa,
  intercambiarOrdenEtapas,
} from '@/lib/catalogo/data'
import { requireAdmin } from '@/lib/auth'

export interface FormState {
  error: string
}

function leerCatalogo(formData: FormData) {
  return catalogoSchema.safeParse({
    categoria: String(formData.get('categoria') ?? ''),
    nombre: String(formData.get('nombre') ?? ''),
    precio_base: String(formData.get('precio_base') ?? ''),
    variable_etiqueta: String(formData.get('variable_etiqueta') ?? ''),
    variable_precio_unitario: String(formData.get('variable_precio_unitario') ?? ''),
  })
}

export async function crearCatalogoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const parsed = leerCatalogo(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  await crearCatalogo(parsed.data)
  revalidatePath('/configuracion/catalogo')
  redirect('/configuracion/catalogo')
}

export async function editarCatalogoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const parsed = leerCatalogo(formData)
  if (!id) return { error: 'Falta el identificador' }
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  await editarCatalogo(id, parsed.data)
  revalidatePath('/configuracion/catalogo')
  revalidatePath(`/configuracion/catalogo/${id}`)
  redirect(`/configuracion/catalogo/${id}`)
}

export async function eliminarCatalogoAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await eliminarCatalogo(id)
  revalidatePath('/configuracion/catalogo')
  redirect('/configuracion/catalogo')
}

// ── Etapas ──────────────────────────────────────────────────

export async function crearEtapaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const catalogoId = String(formData.get('catalogo_trabajo_id') ?? '')
  if (!catalogoId) return { error: 'Falta el trabajo' }
  const parsed = etapaSchema.safeParse({ nombre: String(formData.get('nombre') ?? '') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  await crearEtapa(catalogoId, parsed.data)
  revalidatePath(`/configuracion/catalogo/${catalogoId}`)
  return { error: '' }
}

export async function editarEtapaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const catalogoId = String(formData.get('catalogo_trabajo_id') ?? '')
  if (!id) return { error: 'Falta el identificador' }
  const parsed = etapaSchema.safeParse({ nombre: String(formData.get('nombre') ?? '') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  await editarEtapa(id, parsed.data)
  if (catalogoId) revalidatePath(`/configuracion/catalogo/${catalogoId}`)
  return { error: '' }
}

export async function eliminarEtapaAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const catalogoId = String(formData.get('catalogo_trabajo_id') ?? '')
  if (!id) return
  await eliminarEtapa(id)
  if (catalogoId) revalidatePath(`/configuracion/catalogo/${catalogoId}`)
}

export async function moverEtapaAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const catalogoId = String(formData.get('catalogo_trabajo_id') ?? '')
  const aId = String(formData.get('a_id') ?? '')
  const bId = String(formData.get('b_id') ?? '')
  const aOrden = Number(formData.get('a_orden'))
  const bOrden = Number(formData.get('b_orden'))
  if (!aId || !bId || Number.isNaN(aOrden) || Number.isNaN(bOrden)) return
  await intercambiarOrdenEtapas({ id: aId, orden: aOrden }, { id: bId, orden: bOrden })
  if (catalogoId) revalidatePath(`/configuracion/catalogo/${catalogoId}`)
}
