import { redactar } from '@/lib/registro'

/**
 * Aviso por correo de un error nuevo.
 *
 * Es la diferencia entre un registro y una alerta: el panel hay que ir a
 * mirarlo, y esto llega solo. Sin él, la secuencia sigue siendo la de hoy —el
 * laboratorio lo intenta dos veces, se frustra, y avisa por WhatsApp mañana.
 *
 * Sin dependencias: una petición HTTP a Resend, que ya está configurado y con el
 * dominio verificado para los correos de recuperación de contraseña. Añadir un
 * SDK para un `fetch` sería peso muerto en el arranque de cada función.
 *
 * **Opcional por diseño.** Si no hay clave configurada, no hace nada y no se
 * queja: la pantalla de errores funciona igual. Así el registro empieza a servir
 * desde el primer despliegue, sin depender de configurar nada primero.
 */

const RESEND = 'https://api.resend.com/emails'

/** A dónde llega el aviso. Sin esto no hay a quién avisar. */
function destinatarios(): string[] {
  const crudo = process.env.CORREO_AVISOS ?? process.env.SUPERADMIN_EMAILS ?? ''
  return crudo
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.includes('@'))
}

export interface AvisoDeError {
  donde: string
  mensaje: string
  codigo: string | null
  laboratorioId: string | null
}

function texto(datos: AvisoDeError): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gestionlab.skardiam.com'
  const lineas = [
    `Dónde: ${datos.donde}`,
    `Código: ${datos.codigo ?? 'sin código'}`,
    datos.laboratorioId ? `Laboratorio: ${datos.laboratorioId}` : 'Laboratorio: sin identificar',
    '',
    datos.mensaje,
    '',
    `Detalle y demás errores: ${base}/plataforma/errores`,
  ]
  return lineas.join('\n')
}

/**
 * Manda el aviso. Nunca lanza.
 *
 * Un fallo al avisar de un fallo no puede romper la petición del usuario: el
 * error del que se avisaba ya está guardado, y esto es lo de menos.
 */
export async function avisarDeError(datos: AvisoDeError): Promise<void> {
  const clave = process.env.RESEND_API_KEY
  const para = destinatarios()
  if (!clave || para.length === 0) return

  try {
    const respuesta = await fetch(RESEND, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${clave}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.CORREO_REMITENTE ?? 'GestionLab <avisos@skardiam.com>',
        to: para,
        // El asunto lleva el sitio, no el mensaje: es lo que se lee en la
        // notificación del teléfono sin abrir el correo.
        subject: `GestionLab — error en ${datos.donde}`,
        // Redactado otra vez aquí, aunque ya venga redactado de la base. Este
        // texto sale de la infraestructura propia hacia un tercero, y esa
        // frontera merece su propia comprobación, no confianza en la anterior.
        text: redactar(texto(datos)).slice(0, 4000),
      }),
    })
    if (!respuesta.ok) {
      console.error(`[avisarDeError] Resend respondió ${respuesta.status}`)
    }
  } catch (e) {
    console.error('[avisarDeError] no se pudo enviar el aviso', e)
  }
}
