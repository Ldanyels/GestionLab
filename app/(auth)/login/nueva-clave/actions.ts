'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { claveNuevaSchema } from '@/lib/usuarios/recuperacion'
import { intentar } from '@/lib/acciones'
import { ErrorParaElUsuario } from '@/lib/errores'

export interface ClaveState {
  error: string
}

const ENLACE_GASTADO =
  'Este enlace ya venció o ya se usó. Pide uno nuevo desde «Olvidé mi contraseña».'

/**
 * Canjea el token del enlace y guarda la contraseña nueva, en ese orden y en la
 * misma petición.
 *
 * **El canje va aquí y no en el render de la página**, y esa es la corrección
 * de un fallo real: `lib/supabase/server.ts` descarta la escritura de cookies
 * cuando corre dentro de un Server Component, porque Next no la permite ahí.
 * Validar el token al pintar la página lo **gastaba** —es de un solo uso— y
 * dejaba una sesión que el navegador nunca recibía, así que el guardado fallaba
 * siempre y pedir otro enlace repetía el ciclo.
 *
 * Aquí funciona por dos motivos independientes: una Server Action sí puede
 * escribir cookies, y aunque no pudiera, `verifyOtp` deja la sesión en este
 * mismo cliente, que es el que hace el `updateUser` a continuación.
 */
export async function guardarClaveAction(
  _prev: ClaveState,
  formData: FormData,
): Promise<ClaveState> {
  const tokenHash = String(formData.get('token_hash') ?? '')
  if (!tokenHash) return { error: ENLACE_GASTADO }

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
    'No se pudo guardar la contraseña. Vuelve a intentarlo.',
    async () => {
      // El orden importa: sin sesión, `updateUser` no tiene sobre quién actuar.
      const { error: errToken } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token_hash: tokenHash,
      })
      // Se distingue del fallo al guardar a propósito: el remedio es distinto
      // (pedir otro enlace, frente a volver a intentarlo).
      if (errToken) throw new ErrorParaElUsuario(ENLACE_GASTADO)

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
