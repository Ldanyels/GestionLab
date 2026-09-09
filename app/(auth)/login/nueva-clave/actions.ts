'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { claveNuevaSchema } from '@/lib/usuarios/recuperacion'
import { intentar } from '@/lib/acciones'

export interface ClaveState {
  error: string
}

/**
 * Guarda la contraseña nueva.
 *
 * Funciona porque la página ya validó el token con `verifyOtp` y eso dejó
 * sesión establecida: `updateUser` actúa sobre el usuario de esa sesión. Si
 * alguien llega aquí sin haber pasado por el enlace, no hay sesión y Supabase
 * rechaza la operación.
 */
export async function guardarClaveAction(
  _prev: ClaveState,
  formData: FormData,
): Promise<ClaveState> {
  const parsed = claveNuevaSchema.safeParse({
    password: String(formData.get('password') ?? ''),
    confirmacion: String(formData.get('confirmacion') ?? ''),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await createServerSupabase()
  const r = await intentar(
    'guardarClaveAction',
    'No se pudo guardar la contraseña. Pide un enlace nuevo e intenta otra vez.',
    async () => {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
      // `updateUser` devuelve el fallo en la respuesta en vez de lanzarlo, así
      // que hay que relanzarlo para que el envoltorio lo traduzca y registre.
      if (error) throw error
    },
  )
  if (!r.ok) return r.estado

  // Fuera del envoltorio a propósito: `redirect` funciona lanzando una
  // excepción y dentro se confundiría con un fallo del guardado.
  redirect('/hoy')
}
