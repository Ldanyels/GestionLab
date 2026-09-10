import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getSessionContext } from '@/lib/auth'
import { nombreLaboratorioActual } from '@/lib/tenant'
import { aceptacionesDeLaboratorio } from '@/lib/legal/data'
import { DOCUMENTOS_LEGALES } from '@/lib/legal/textos.generated'
import { textoSeguro } from '@/lib/recibos/lineas'
import { truncar } from '@/lib/pdf/util'
import { registrarError } from '@/lib/registro'

/**
 * Constancia de aceptación de las condiciones, en PDF.
 *
 * Es el documento que se muestra si alguien discute haber aceptado. Lleva la
 * **huella de cada documento**, que es lo que permite demostrar qué texto se
 * aceptó: sin ella la constancia diría «aceptó los términos» sin poder probar
 * cuáles, porque el texto pudo cambiar después.
 *
 * La descarga el propio laboratorio. Enviarla por correo automáticamente
 * requeriría la clave de Resend en la aplicación —hoy solo está en Supabase, que
 * manda los correos de recuperación—, así que por ahora está siempre
 * disponible aquí en vez de llegar una vez y perderse.
 */
export async function GET(): Promise<Response> {
  try {
    const { userId, perfil } = await getSessionContext()
    if (!userId || !perfil) return new Response('No autorizado', { status: 401 })

    const [aceptaciones, laboratorio] = await Promise.all([
      aceptacionesDeLaboratorio(perfil.laboratorio_id),
      nombreLaboratorioActual(),
    ])
    if (aceptaciones.length === 0) {
      return new Response('Este laboratorio todavía no ha aceptado las condiciones', {
        status: 404,
      })
    }

    const pdf = await PDFDocument.create()
    const pagina = pdf.addPage([595.28, 841.89]) // A4
    const normal = await pdf.embedFont(StandardFonts.Helvetica)
    const negrita = await pdf.embedFont(StandardFonts.HelveticaBold)
    const gris = rgb(0.42, 0.45, 0.5)
    const negro = rgb(0.1, 0.11, 0.13)

    const M = 56
    const ANCHO = 595.28 - M * 2
    let y = 841.89 - M

    const linea = (
      texto: string,
      { size = 10, font = normal, color = negro, salto = 15 } = {},
    ) => {
      pagina.drawText(truncar(font, textoSeguro(texto), size, ANCHO), {
        x: M,
        y,
        size,
        font,
        color,
      })
      y -= salto
    }

    linea('CONSTANCIA DE ACEPTACION DE CONDICIONES', { size: 15, font: negrita, salto: 10 })
    linea('GestionLab', { size: 10, color: gris, salto: 26 })

    linea('Laboratorio', { size: 8, font: negrita, color: gris, salto: 13 })
    linea(laboratorio, { size: 12, font: negrita, salto: 22 })

    // Todas las filas de una misma aceptación traen los mismos datos de quien
    // aceptó; se toma la más reciente.
    const quien = aceptaciones[0]!
    linea('Aceptado por', { size: 8, font: negrita, color: gris, salto: 13 })
    linea(quien.nombre_completo, { size: 11, font: negrita, salto: 14 })
    linea(`DNI ${quien.dni}${quien.cargo ? ` — ${quien.cargo}` : ''}`, {
      size: 10,
      color: gris,
      salto: 14,
    })
    linea(quien.usuario_correo, { size: 10, color: gris, salto: 26 })

    linea('Documentos aceptados', { size: 8, font: negrita, color: gris, salto: 16 })

    const titulos = new Map(DOCUMENTOS_LEGALES.map((d) => [d.clave, d.titulo]))
    for (const a of aceptaciones) {
      linea(titulos.get(a.documento as never) ?? a.documento, {
        size: 10.5,
        font: negrita,
        salto: 13,
      })
      const fecha = new Date(a.creado_en)
      linea(
        `Version ${a.version}  ·  ${fecha.toLocaleString('es-PE', { timeZone: 'America/Lima' })}`,
        { size: 9, color: gris, salto: 12 },
      )
      // La huella completa, partida para que quepa: es el dato verificable.
      linea(`SHA-256: ${huellaDe(a.documento, a.version)}`, {
        size: 7.5,
        color: gris,
        salto: 20,
      })
    }

    y -= 8
    pagina.drawLine({
      start: { x: M, y },
      end: { x: M + ANCHO, y },
      thickness: 0.7,
      color: rgb(0.85, 0.87, 0.9),
    })
    y -= 20

    for (const t of [
      'La huella SHA-256 identifica el texto exacto que se acepto. Si el documento',
      'cambia, cambia su huella, y la aceptacion anterior deja de aplicar: el sistema',
      'vuelve a pedir la aceptacion del texto nuevo.',
      '',
      `Constancia generada el ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}.`,
    ]) {
      linea(t, { size: 8.5, color: gris, salto: 12 })
    }

    const bytes = await pdf.save()
    return new Response(bytes as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="constancia-condiciones.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const mensaje = registrarError('constanciaLegal', e, 'No se pudo generar la constancia')
    return new Response(mensaje, { status: 500 })
  }
}

/** La huella vigente del documento, para mostrarla completa en la constancia. */
function huellaDe(clave: string, version: string): string {
  const doc = DOCUMENTOS_LEGALES.find((d) => d.clave === clave && d.version === version)
  // Si la versión aceptada ya no es la vigente, no tenemos su texto: se dice,
  // en vez de mostrar la huella de otro documento.
  return doc?.hash ?? '(version anterior; huella no disponible en esta version del sistema)'
}
