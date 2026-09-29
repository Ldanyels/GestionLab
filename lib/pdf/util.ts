import type { PDFFont } from 'pdf-lib'
import { textoSeguro } from '@/lib/recibos/lineas'

/**
 * Recorta un texto para que quepa en `maxAncho` puntos, agregando "…".
 *
 * Sanea antes de medir. Las fuentes estándar del PDF solo codifican WinAnsi y
 * `widthOfTextAtSize` **lanza** con cualquier otra cosa —una flecha, un emoji,
 * un nombre en otro alfabeto—, así que medir sin sanear tira el documento
 * entero por un carácter en el nombre de un paciente. Sanear aquí, y no solo al
 * dibujar, es lo que hace que eso no pueda pasar: todo lo que se pinta pasa
 * antes por una medición.
 */
export function truncar(
  font: PDFFont,
  texto: string,
  size: number,
  maxAncho: number,
): string {
  const limpio = textoSeguro(texto)
  if (font.widthOfTextAtSize(limpio, size) <= maxAncho) return limpio
  let s = limpio
  while (s.length > 1 && font.widthOfTextAtSize(`${s}…`, size) > maxAncho) {
    s = s.slice(0, -1)
  }
  return `${s}…`
}
