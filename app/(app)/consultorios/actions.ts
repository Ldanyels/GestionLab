'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { consultorioSchema, doctorSchema } from '@/lib/consultorios/schema'
import {
  crearConsultorio,
  editarConsultorio,
  eliminarConsultorio,
  crearDoctor,
  editarDoctor,
  eliminarDoctor,
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
  await crearConsultorio(parsed.data)
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
  await editarConsultorio(id, parsed.data)
  revalidatePath('/consultorios')
  revalidatePath(`/consultorios/${id}`)
  redirect(`/consultorios/${id}`)
}

export async function eliminarConsultorioAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await eliminarConsultorio(id)
  revalidatePath('/consultorios')
  redirect('/consultorios')
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
  await crearDoctor(consultorioId, parsed.data)
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
  await editarDoctor(id, parsed.data)
  if (consultorioId) revalidatePath(`/consultorios/${consultorioId}`)
  return { error: '' }
}

export async function eliminarDoctorAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const consultorioId = String(formData.get('consultorio_id') ?? '')
  if (!id) return
  await eliminarDoctor(id)
  if (consultorioId) revalidatePath(`/consultorios/${consultorioId}`)
}
