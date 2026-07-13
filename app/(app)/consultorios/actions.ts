'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { consultorioSchema } from '@/lib/consultorios/schema'
import {
  crearConsultorio,
  editarConsultorio,
  eliminarConsultorio,
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
