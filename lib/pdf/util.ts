import type { PDFFont } from 'pdf-lib'

/** Recorta un texto para que quepa en `maxAncho` puntos, agregando "…". */
export function truncar(
  font: PDFFont,
  texto: string,
  size: number,
  maxAncho: number,
): string {
  if (font.widthOfTextAtSize(texto, size) <= maxAncho) return texto
  let s = texto
  while (s.length > 1 && font.widthOfTextAtSize(`${s}…`, size) > maxAncho) {
    s = s.slice(0, -1)
  }
  return `${s}…`
}
