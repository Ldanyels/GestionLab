/**
 * Reglas de las fotografías de un trabajo.
 *
 * Dos al recibir y dos al entregar, y borrado a los 6 meses. No son números
 * arbitrarios: están escritos en la política de privacidad y en el contrato de
 * encargo que firma cada laboratorio, así que cambiarlos aquí sin cambiarlos
 * allí convertiría el sistema en incumplidor de su propio contrato.
 */

export const MOMENTOS = ['recepcion', 'entrega'] as const
export type MomentoFoto = (typeof MOMENTOS)[number]

export const ETIQUETA_MOMENTO: Record<MomentoFoto, string> = {
  recepcion: 'Como llegó',
  entrega: 'Como se entregó',
}

/** Tope por momento. Declarado en el contrato de encargo. */
export const MAX_POR_MOMENTO = 2

/** Meses que se conservan. Declarado en la política de privacidad. */
export const MESES_DE_CONSERVACION = 6

export function esMomento(v: string): v is MomentoFoto {
  return (MOMENTOS as readonly string[]).includes(v)
}

/**
 * La primera posición libre, o `null` si ya no caben más.
 *
 * Reutiliza el hueco de una foto borrada: sin eso, tras borrar la primera
 * habría que borrar también la segunda para poder subir otra.
 */
export function huecoLibre(ocupados: readonly number[]): number | null {
  for (let i = 1; i <= MAX_POR_MOMENTO; i++) {
    if (!ocupados.includes(i)) return i
  }
  return null
}

/**
 * Dónde vive el archivo dentro del bucket.
 *
 * **La primera carpeta es el laboratorio**, y de ahí lo deduce la política de
 * `storage.objects` que impide que un laboratorio lea los archivos de otro.
 * Cambiar ese orden rompería el aislamiento del almacenamiento sin que ninguna
 * prueba de la aplicación lo notara, y por eso hay una prueba que lo fija.
 *
 * El sufijo único evita que, al reemplazar una foto, el navegador siga
 * mostrando la anterior desde su caché.
 */
export function rutaDeFoto(
  laboratorioId: string,
  trabajoId: string,
  momento: MomentoFoto,
  orden: number,
  sufijo: string,
): string {
  return `${laboratorioId}/${trabajoId}/${momento}-${orden}-${sufijo}.jpg`
}

/**
 * Cuándo se borra una foto tomada en ese instante.
 *
 * Suma meses recortando al último día del mes cuando el día no existe: el 31 de
 * agosto más seis meses es el 28 de febrero. Sin el recorte, la fecha se
 * desbordaría al mes siguiente y la foto viviría dos días de más —o, con el
 * signo contrario en otro cálculo, se borraría antes de tiempo. Un borrado no
 * se deshace.
 */
export function fechaDeCaducidad(tomadaEn: string): string {
  const d = new Date(tomadaEn)
  const dia = d.getUTCDate()
  const objetivo = new Date(d)
  objetivo.setUTCDate(1)
  objetivo.setUTCMonth(objetivo.getUTCMonth() + MESES_DE_CONSERVACION)
  const ultimoDia = new Date(
    Date.UTC(objetivo.getUTCFullYear(), objetivo.getUTCMonth() + 1, 0),
  ).getUTCDate()
  objetivo.setUTCDate(Math.min(dia, ultimoDia))
  return objetivo.toISOString()
}

export function estaVencida(tomadaEn: string, ahora: string): boolean {
  return new Date(ahora).getTime() > new Date(fechaDeCaducidad(tomadaEn)).getTime()
}
