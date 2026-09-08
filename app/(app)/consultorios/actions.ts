'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { intentar, intentarSinEstado } from '@/lib/acciones'
import { consultorioSchema, doctorSchema } from '@/lib/consultorios/schema'
import {
  crearConsultorio,
  editarConsultorio,
  eliminarConsultorio,
  crearDoctor,
  editarDoctor,
  eliminarDoctor,
  archivarConsultorio,
  archivarDoctor,
} from '@/lib/consultorios/data'

export interface FormState {
  error: string
}

function leerConsultorio(formData: FormData) {
  return consultorioSchema.safeParse({
    nombre: String(formData.get('nombre') ?? ''),
    contacto: String(formData.get('contacto') ?? ''),
    notas: String(formData.get('notas') ?? ''),
  })
}

export async function crearConsultorioAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = leerConsultorio(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const r = await intentar('crearConsultorioAction', 'No se pudo guardar el consultorio', () =>
    crearConsultorio(parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath('/consultorios')
  redirect('/consultorios')
}

export async function editarConsultorioAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '')
  const parsed = leerConsultorio(formData)
  if (!id) return { error: 'Falta el identificador' }
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const r = await intentar('editarConsultorioAction', 'No se pudieron guardar los cambios', () =>
    editarConsultorio(id, parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath('/consultorios')
  revalidatePath(`/consultorios/${id}`)
  redirect(`/consultorios/${id}`)
}

export async function eliminarConsultorioAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await intentarSinEstado('eliminarConsultorioAction', 'No se pudo eliminar el consultorio', () =>
    eliminarConsultorio(id),
  )

  revalidatePath('/consultorios')
  redirect('/consultorios')
}

export async function archivarConsultorioAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const activo = String(formData.get('activo') ?? '') === 'true'
  if (!id) return

  await intentarSinEstado(
    'archivarConsultorioAction',
    activo ? 'No se pudo reactivar el consultorio' : 'No se pudo archivar el consultorio',
    () => archivarConsultorio(id, activo),
  )

  revalidatePath('/consultorios')
  revalidatePath(`/consultorios/${id}`)
  redirect(activo ? `/consultorios/${id}` : '/consultorios')
}

export async function archivarDoctorAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const consultorioId = String(formData.get('consultorio_id') ?? '')
  const activo = String(formData.get('activo') ?? '') === 'true'
  if (!id) return

  await intentarSinEstado(
    'archivarDoctorAction',
    activo ? 'No se pudo reactivar el doctor' : 'No se pudo archivar el doctor',
    () => archivarDoctor(id, activo),
  )

  if (consultorioId) revalidatePath(`/consultorios/${consultorioId}`)
}

export async function crearDoctorAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const consultorioId = String(formData.get('consultorio_id') ?? '')
  if (!consultorioId) return { error: 'Falta el consultorio' }
  const parsed = doctorSchema.safeParse({
    nombre: String(formData.get('nombre') ?? ''),
    contacto: String(formData.get('contacto') ?? ''),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const r = await intentar('crearDoctorAction', 'No se pudo guardar el doctor', () =>
    crearDoctor(consultorioId, parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath(`/consultorios/${consultorioId}`)
  return { error: '' }
}

export async function editarDoctorAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '')
  const consultorioId = String(formData.get('consultorio_id') ?? '')
  if (!id) return { error: 'Falta el identificador' }
  const parsed = doctorSchema.safeParse({
    nombre: String(formData.get('nombre') ?? ''),
    contacto: String(formData.get('contacto') ?? ''),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const r = await intentar('editarDoctorAction', 'No se pudieron guardar los cambios', () =>
    editarDoctor(id, parsed.data),
  )
  if (!r.ok) return r.estado

  if (consultorioId) revalidatePath(`/consultorios/${consultorioId}`)
  return { error: '' }
}

export async function eliminarDoctorAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const consultorioId = String(formData.get('consultorio_id') ?? '')
  if (!id) return

  await intentarSinEstado('eliminarDoctorAction', 'No se pudo eliminar el doctor', () =>
    eliminarDoctor(id),
  )

  if (consultorioId) revalidatePath(`/consultorios/${consultorioId}`)
}
