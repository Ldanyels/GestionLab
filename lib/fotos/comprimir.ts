/**
 * Compresión de la foto **en el teléfono**, antes de subirla.
 *
 * No es una optimización: es lo que hace viable la función. Una foto de cámara
 * son 3–8 MB; con el wifi de un taller, subir eso tarda decenas de segundos y
 * falla a menudo. Reducida a 1600 px de lado mayor y JPEG de calidad 0,8 queda
 * en unos 300 KB —dieciséis veces menos— y sube en un par de segundos.
 *
 * El ahorro también es de dinero: sin comprimir, veinte laboratorios llenarían
 * los 100 GB del plan en menos de dos meses.
 *
 * Para una evidencia de estado de una pieza dental, 1600 px es de sobra: se
 * distingue una fisura o un color sin guardar el detalle de una cámara.
 */

/** Lado mayor tras reducir. */
export const LADO_MAXIMO = 1600

/** Calidad JPEG. Por encima de 0,85 el archivo crece sin que se note. */
export const CALIDAD = 0.8

export interface Medidas {
  ancho: number
  alto: number
}

/**
 * Las medidas a las que hay que dibujar, manteniendo la proporción.
 *
 * Una foto que ya es pequeña no se agranda: escalarla hacia arriba no añade
 * detalle, solo peso, y encima se ve peor que el original.
 */
export function medidasReducidas(ancho: number, alto: number): Medidas {
  const lado = Math.max(ancho, alto)
  if (lado <= LADO_MAXIMO) return { ancho, alto }

  const factor = LADO_MAXIMO / lado
  return {
    // Enteros: un canvas de 1066,67 píxeles no existe, y cada navegador trunca
    // los decimales a su manera. Mínimo 1, porque un lado de 0 no dibuja nada.
    ancho: Math.max(1, Math.round(ancho * factor)),
    alto: Math.max(1, Math.round(alto * factor)),
  }
}

/**
 * Reduce y recomprime una imagen en el navegador.
 *
 * Usa `createImageBitmap` en vez de un `<img>` con `onload`: no toca el DOM, no
 * depende de que el elemento esté insertado en la página, y respeta la
 * orientación EXIF —sin eso, las fotos tomadas en vertical con algunos
 * teléfonos se guardan giradas.
 */
export async function comprimirImagen(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
  const { ancho, alto } = medidasReducidas(bitmap.width, bitmap.height)

  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar la imagen')
  ctx.drawImage(bitmap, 0, 0, ancho, alto)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    lienzo.toBlob(resolve, 'image/jpeg', CALIDAD),
  )
  if (!blob) throw new Error('No se pudo comprimir la imagen')
  return blob
}
