/**
 * Agrupación de errores iguales.
 *
 * Un error que le pasa a treinta laboratorios treinta veces es **un** problema,
 * no novecientos avisos. Sin agrupar, un fallo repetido enterraría a los demás y
 * el registro dejaría de servir para lo único que existe: mirar la lista y saber
 * qué arreglar primero.
 *
 * La huella se calcula sobre el mensaje **normalizado**: sin identificadores,
 * sin números y sin fechas, que son justo las partes que cambian entre dos
 * ocurrencias del mismo fallo.
 *
 * No usa `node:crypto`. Esto no protege nada —es una clave de agrupación, no un
 * sello— y una función propia funciona igual en cualquier entorno de ejecución
 * sin arrastrar el módulo a donde no toca.
 */

/** Tope del mensaje guardado. Un stack de Postgres puede traer miles de caracteres. */
const LARGO_MAXIMO = 300

/**
 * Deja el mensaje en su parte estable.
 *
 * El orden importa: primero se borran los valores de Postgres (que pueden
 * contener el nombre de un paciente), después los identificadores y las fechas,
 * y los números al final, porque un UUID y una fecha también contienen dígitos y
 * si se tocaran antes quedarían irreconocibles.
 */
export function normalizarMensaje(texto: string): string {
  const limpio = texto
    // Valores que Postgres adjunta tras un `=`. Va primero y por la misma razón
    // que existe `redactar` en el registro: ahí puede viajar un dato de salud.
    .replace(/=\([^)]*\)/g, '=(···)')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '‹id›')
    .replace(/\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?/g, '‹fecha›')
    .replace(/\d+(?:[.,]\d+)?/g, '‹n›')
    .replace(/\s+/g, ' ')
    .trim()

  return limpio.length > LARGO_MAXIMO ? limpio.slice(0, LARGO_MAXIMO) : limpio
}

/**
 * FNV-1a de 32 bits, con semilla y prima variables.
 *
 * `Math.imul` en vez de `*` porque la multiplicación normal de JavaScript pasa a
 * coma flotante en cuanto el producto supera los 53 bits y deja de ser el
 * entero de 32 bits que el algoritmo necesita. Con `imul` el resultado es el
 * mismo en cualquier motor, hoy y dentro de un año: si la huella cambiara, los
 * errores viejos dejarían de agruparse con los nuevos.
 *
 * Se mezclan los dos bytes de cada carácter para que las tildes cuenten —
 * `Díaz` y `Dfaz` no deben ser el mismo mensaje.
 */
function fnv32(texto: string, semilla: number, prima: number): string {
  let h = semilla >>> 0

  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i)
    h = Math.imul(h ^ (c & 0xff), prima) >>> 0
    h = Math.imul(h ^ (c >>> 8), prima) >>> 0
  }

  return h.toString(16).padStart(8, '0')
}

/**
 * Identifica un tipo de error: el sitio donde ocurre más su mensaje estable.
 *
 * Incluye `donde` porque el mismo mensaje —«permiso denegado»— en el alta de un
 * trabajo y en el borrado de un abono son dos problemas distintos que se
 * arreglan en sitios distintos.
 */
export function huellaDeError(donde: string, mensaje: string): string {
  // El separador impide que dos pares distintos formen la misma clave: sin él,
  // ('abc', 'def') y ('ab', 'cdef') se agruparían juntos. El carácter no puede
  // aparecer en un nombre de función.
  const clave = donde + '␟' + normalizarMensaje(mensaje)
  // Dos pasadas con distinta semilla y distinta prima dan los 64 bits. Con una
  // sola de 32 bits, entre unos cientos de tipos de error ya sería esperable
  // que dos distintos cayeran en la misma fila.
  return fnv32(clave, 0x811c9dc5, 0x01000193) + fnv32(clave, 0x9e3779b9, 0x85ebca6b)
}
