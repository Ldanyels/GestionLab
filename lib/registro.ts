/**
 * Registro estructurado de errores del servidor.
 *
 * Hoy escribe en consola, que en Vercel queda en los logs de la función. El
 * destino es reemplazable con `configurarDestino`, así que mudarse a Azure
 * Application Insights más adelante es cambiar una función, no tocar las
 * llamadas repartidas por la aplicación. Sin dependencias ni amarre a proveedor.
 *
 * Redacción obligatoria: los mensajes de PostgreSQL incluyen los valores que
 * provocaron el fallo ("Key (paciente_nombre)=(Juan Pérez) already exists"), y
 * el sistema guarda nombres de pacientes, que bajo la Ley 29733 son datos de
 * salud. Este módulo borra esos valores antes de que salgan a cualquier log.
 */
import { interpretarError } from './errores'

export type Severidad = 'error' | 'aviso'

export interface Contexto {
  laboratorioId?: string | null
  usuarioId?: string | null
}

export interface EntradaDeRegistro {
  momento: string
  severidad: Severidad
  /** Nombre de la función donde ocurrió, p. ej. `crearTrabajoAction`. */
  donde: string
  /** Mensaje original, ya redactado. */
  mensaje: string
  codigo: string | null
  laboratorioId: string | null
  usuarioId: string | null
}

export type Destino = (entrada: EntradaDeRegistro) => void

let destino: Destino | null = null

/** Reemplaza el destino del registro. `null` vuelve a la consola. */
export function configurarDestino(nuevo: Destino | null): void {
  destino = nuevo
}

/**
 * Borra los valores que PostgreSQL adjunta entre paréntesis después de un `=`,
 * conservando el nombre de la columna, que sí sirve para depurar.
 */
export function redactar(texto: string): string {
  return texto.replace(/=\([^)]*\)/g, '=(···)')
}

export function construirEntrada(
  donde: string,
  e: unknown,
  contexto: Contexto = {},
): EntradaDeRegistro {
  const crudo =
    e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e ?? null)
  const { codigo } = interpretarError(e, '')

  return {
    momento: new Date().toISOString(),
    severidad: 'error',
    donde,
    mensaje: redactar(crudo ?? ''),
    codigo,
    laboratorioId: contexto.laboratorioId ?? null,
    usuarioId: contexto.usuarioId ?? null,
  }
}

/**
 * Registra el error y devuelve el mensaje que debe ver el usuario.
 *
 * Pensado para usarse directo en una Server Action:
 *
 *   catch (e) {
 *     return { error: registrarError('crearTrabajoAction', e, 'No se pudo guardar el trabajo') }
 *   }
 *
 * Relanza `redirect()` y `notFound()` en vez de tratarlos como errores.
 */
export function registrarError(donde: string, e: unknown, respaldo: string): string {
  // `interpretarError` relanza el control de flujo de Next; que ocurra antes de
  // construir la entrada evita registrar navegaciones como si fueran fallos.
  const legible = interpretarError(e, respaldo)
  const entrada = construirEntrada(donde, e)

  if (destino) {
    try {
      destino(entrada)
    } catch {
      // Un destino caído no puede tumbar la petición del usuario.
    }
  } else {
    console.error(`[${entrada.donde}] ${entrada.codigo ?? 'sin-codigo'}: ${entrada.mensaje}`)
  }

  return legible.mensaje
}
