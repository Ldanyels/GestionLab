'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getSessionContext } from '@/lib/auth'
// Se reutiliza el ayudante del panel en vez de escribir otro: resuelve el
// correo del token verificado localmente, con respaldo por red.
import { correoSesion } from '@/lib/plataforma/acceso'
import { registrarAceptacion } from '@/lib/legal/data'
import { datosDeAceptacionSchema, documentosPendientes } from '@/lib/legal/pendientes'
import { aceptacionesDeLaboratorio } from '@/lib/legal/data'
import { intentar } from '@/lib/acciones'

export interface AceptacionState {
  error: string
}

/**
 * Registra la aceptación de los documentos legales.
 *
 * Todo lo que da valor al registro se toma **del servidor**, nunca del
 * formulario: quién es el usuario, su correo, la versión y la huella de cada
 * documento. Del formulario solo vienen los datos que la persona teclea y qué
 * casillas marcó. Si la versión viniera del cliente, cualquiera podría
 * registrar que aceptó un texto distinto del que se le mostró, y el registro
 * dejaría de probar nada.
 */
export async function aceptarDocumentosAction(
  _prev: AceptacionState,
  formData: FormData,
): Promise<AceptacionState> {
  const { userId, perfil } = await getSessionContext()
  if (!userId || !perfil) return { error: 'Sesión no válida' }

  // Solo quien representa al laboratorio se compromete por él.
  if (perfil.rol !== 'admin') {
    return { error: 'Solo el administrador del laboratorio puede aceptar las condiciones' }
  }

  const parsed = datosDeAceptacionSchema.safeParse({
    nombre: String(formData.get('nombre') ?? ''),
    dni: String(formData.get('dni') ?? ''),
    cargo: String(formData.get('cargo') ?? ''),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos' }
  }

  const marcados = formData.getAll('documento').map(String)
  const pendientes = documentosPendientes(await aceptacionesDeLaboratorio(perfil.laboratorio_id))

  // Que estén marcados todos los que faltaban. El navegador ya lo exige con
  // `required`, pero eso se puede saltar enviando el formulario a mano.
  const faltan = pendientes.filter((d) => !marcados.includes(d.clave))
  if (faltan.length > 0) {
    return {
      error:
        faltan.length === 1
          ? `Falta aceptar: ${faltan[0]!.titulo}`
          : 'Falta aceptar alguno de los documentos',
    }
  }

  const [cabeceras, correo] = await Promise.all([headers(), correoSesion()])
  const firma = String(formData.get('firma_svg') ?? '')

  const r = await intentar(
    'aceptarDocumentosAction',
    'No se pudo registrar la aceptación. Vuelve a intentarlo.',
    () =>
      registrarAceptacion(
        {
          laboratorioId: perfil.laboratorio_id,
          usuarioId: userId,
          usuarioCorreo: correo ?? '',
          // La primera dirección de `x-forwarded-for` es la del cliente; las
          // siguientes son los intermediarios.
          ip: cabeceras.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
          agente: cabeceras.get('user-agent'),
          firmaSvg: firma || null,
        },
        parsed.data,
        pendientes.map((d) => d.clave),
      ),
  )
  if (!r.ok) return r.estado

  // Sin redirect: al revalidar, el layout vuelve a comprobar los pendientes,
  // ya no encuentra ninguno y deja pasar a la aplicación.
  revalidatePath('/', 'layout')
  return { error: '' }
}
