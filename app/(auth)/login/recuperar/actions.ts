'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { correoSchema } from '@/lib/usuarios/recuperacion'
import { registrarError } from '@/lib/registro'

export interface RecuperarState {
  error: string
  enviado: boolean
}

/** URL pública del sistema. La usa el destino del enlace del correo. */
function sitio(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gestionlab.skardiam.com'
}

export async function pedirEnlaceAction(
  _prev: RecuperarState,
  formData: FormData,
): Promise<RecuperarState> {
  const parsed = correoSchema.safeParse({ email: String(formData.get('email') ?? '') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Correo inválido', enviado: false }
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // La plantilla propia arma el enlace con `{{ .SiteURL }}`, así que este
    // `redirectTo` no decide el destino. Se envía igual porque es la red de
    // seguridad si alguna vez se usa la plantilla por defecto de Supabase: sin
    // él, ese enlace llevaría a la raíz del sitio en vez de a esta pantalla.
    redirectTo: `${sitio()}/login/nueva-clave`,
  })

  // Se responde lo mismo exista o no la cuenta. Si el resultado cambiara según
  // el correo, esta pantalla se convertiría en un detector de quién tiene
  // cuenta en el sistema. El fallo real queda en el registro del servidor.
  if (error) {
    registrarError('pedirEnlaceAction', error, 'no se pudo enviar el enlace de recuperación')
  }

  return { error: '', enviado: true }
}
