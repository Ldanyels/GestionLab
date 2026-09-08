/**
 * Traducción de errores técnicos a mensajes que un protesista pueda entender.
 *
 * Antes, la capa de datos hacía `throw new Error(error.message)` y las Server
 * Actions no lo capturaban: la excepción escapaba y el usuario veía la pantalla
 * cruda de Next ("Application error: a server-side exception has occurred"),
 * perdiendo además lo que había escrito en el formulario. Este módulo convierte
 * esos errores en texto accionable, y nunca deja pasar el mensaje crudo de
 * Postgres al usuario: los detalles internos van al registro, no a la pantalla.
 */

export interface ErrorLegible {
  /** Texto para mostrar en la interfaz. Siempre en español, sin detalles internos. */
  mensaje: string
  /** Código original del error, si venía. Para el registro, no para el usuario. */
  codigo: string | null
}

const PERMISO = 'No tienes permiso para hacer esto.'
const DUPLICADO = 'Ya existe un registro con esos datos.'
const DEPENDENCIAS = 'No se puede completar: hay otros registros que dependen de este.'
const OBLIGATORIO = 'Falta completar un campo obligatorio.'
const REGLAS = 'Alguno de los datos no cumple las reglas del sistema.'
const DESACTUALIZADO = 'El sistema está desactualizado. Avisa al administrador.'
const SIN_CONEXION =
  'No se pudo conectar con el servidor. Revisa tu conexión y vuelve a intentarlo.'
const LENTO = 'La operación tardó demasiado. Vuelve a intentarlo.'
const NO_ENCONTRADO = 'No se encontró el registro.'

/** Códigos de PostgreSQL y de PostgREST que sabemos explicar. */
const POR_CODIGO: Record<string, string> = {
  '23502': OBLIGATORIO, // not_null_violation
  '23503': DEPENDENCIAS, // foreign_key_violation
  '23505': DUPLICADO, // unique_violation
  '23514': REGLAS, // check_violation
  '42501': PERMISO, // insufficient_privilege (incluye bloqueo por RLS)
  '42703': DESACTUALIZADO, // undefined_column: falta una migración
  '42P01': DESACTUALIZADO, // undefined_table: falta una migración
  '57014': LENTO, // query_canceled / statement timeout
  PGRST116: NO_ENCONTRADO, // ninguna fila donde se esperaba una
  PGRST301: PERMISO, // token inválido o sin autorización
}

/**
 * Respaldo por texto, para cuando el código se perdió en el camino: la capa de
 * datos actual relanza solo `error.message`. El orden importa: la primera
 * expresión que coincide gana, así que las más específicas van antes.
 */
const POR_TEXTO: ReadonlyArray<readonly [RegExp, string]> = [
  [/row-level security/, PERMISO],
  [/permission denied|insufficient privilege/, PERMISO],
  [/duplicate key value|violates unique constraint/, DUPLICADO],
  [/violates foreign key constraint/, DEPENDENCIAS],
  [/null value in column|violates not-null constraint/, OBLIGATORIO],
  [/violates check constraint/, REGLAS],
  [/does not exist/, DESACTUALIZADO],
  [/fetch failed|networkerror|econnrefused|enotfound|socket hang up|und_err/, SIN_CONEXION],
  [/statement timeout|canceling statement|etimedout/, LENTO],
]

/**
 * ¿Es una de las excepciones que Next usa para controlar el flujo?
 *
 * `redirect()` y `notFound()` funcionan lanzando una excepción con un `digest`
 * reconocible. Un `try/catch` que las trate como errores rompe la navegación en
 * silencio: el usuario se queda en la misma página y el guardado sí ocurrió.
 * Por eso hay que relanzarlas siempre.
 */
export function esControlDeFlujoDeNext(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const { digest } = e as { digest?: unknown }
  if (typeof digest !== 'string') return false
  return (
    digest.startsWith('NEXT_REDIRECT') ||
    digest === 'NEXT_NOT_FOUND' ||
    digest.startsWith('NEXT_HTTP_ERROR_FALLBACK')
  )
}

function codigoDe(e: unknown): string | null {
  if (typeof e !== 'object' || e === null) return null
  const { code } = e as { code?: unknown }
  return typeof code === 'string' && code.length > 0 ? code : null
}

function textoDe(e: unknown): string {
  if (typeof e === 'string') return e
  if (typeof e === 'object' && e !== null) {
    const { message } = e as { message?: unknown }
    if (typeof message === 'string') return message
  }
  return ''
}

/**
 * Interpreta cualquier valor lanzado y devuelve qué mostrarle al usuario.
 *
 * Relanza el control de flujo de Next: si el valor era un `redirect()`, este
 * módulo no lo convierte en mensaje, lo deja pasar.
 */
export function interpretarError(e: unknown, respaldo: string): ErrorLegible {
  if (esControlDeFlujoDeNext(e)) throw e

  const codigo = codigoDe(e)
  const porCodigo = codigo ? POR_CODIGO[codigo] : undefined
  if (porCodigo) return { mensaje: porCodigo, codigo }

  const texto = textoDe(e).toLowerCase()
  for (const [patron, mensaje] of POR_TEXTO) {
    if (patron.test(texto)) return { mensaje, codigo }
  }

  return { mensaje: respaldo, codigo }
}

/** Como `interpretarError`, cuando solo hace falta el texto. */
export function mensajeDeError(e: unknown, respaldo: string): string {
  return interpretarError(e, respaldo).mensaje
}
