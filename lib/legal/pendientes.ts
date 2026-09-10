import { z } from 'zod'
import { DOCUMENTOS_LEGALES, type DocumentoLegal } from './textos.generated'

/** Una aceptación ya registrada, tal como se lee de la base. */
export interface AceptacionRegistrada {
  documento: string
  version: string
}

/**
 * Qué documentos le faltan por aceptar.
 *
 * Se compara **documento y versión**, no solo el documento. Una aceptación de
 * la versión anterior no vale para la nueva: esa persona leyó otro texto, y el
 * sentido de sellar los documentos era justamente poder afirmar qué leyó.
 */
export function documentosPendientes(
  aceptadas: readonly AceptacionRegistrada[],
): DocumentoLegal[] {
  const yaEsta = new Set(aceptadas.map((a) => `${a.documento}@${a.version}`))
  return DOCUMENTOS_LEGALES.filter((d) => !yaEsta.has(`${d.clave}@${d.version}`))
}

export function todoAceptado(aceptadas: readonly AceptacionRegistrada[]): boolean {
  return documentosPendientes(aceptadas).length === 0
}

/**
 * Los datos que teclea quien acepta.
 *
 * El número de DNI sí, la **imagen del documento no**: para aceptar unos
 * términos el número alcanza, y guardar la foto sería recoger más datos de los
 * necesarios —contra el principio de proporcionalidad de la Ley 29733— además
 * de convertir al proveedor en custodio de documentos de identidad, que es un
 * blanco mucho más valioso que unos registros de trabajos dentales.
 */
export const datosDeAceptacionSchema = z.object({
  nombre: z.string().trim().min(1, 'Escribe tu nombre completo').max(120),
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'El DNI son 8 dígitos'),
  cargo: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : null)),
})

export type DatosDeAceptacion = z.infer<typeof datosDeAceptacionSchema>
