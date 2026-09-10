import { createAdminSupabase } from '@/lib/supabase/admin'
import { redactar } from '@/lib/registro'
import { avisarDeError } from './aviso'
import { huellaDeError, normalizarMensaje } from './huella'

/**
 * Lectura y escritura del registro de errores.
 *
 * Va por la clave de servicio y la tabla tiene RLS activo sin políticas: son
 * datos de operación del proveedor. Los mensajes de error de un laboratorio no
 * tienen por qué ser legibles por otro.
 *
 * **Nada de aquí lanza.** Este módulo existe para enterarse de los fallos; si
 * fallara él y tumbara la petición, convertiría un error en dos.
 */

export interface ErrorRegistrado {
  huella: string
  donde: string
  mensaje: string
  codigo: string | null
  veces: number
  primera_vez: string
  ultima_vez: string
  laboratorios: string[]
  resuelto_el: string | null
  /** Cuándo se mandó el aviso por correo de este tipo de error. */
  avisado_el: string | null
}

const COLUMNAS =
  'huella, donde, mensaje, codigo, veces, primera_vez, ultima_vez, laboratorios, resuelto_el, avisado_el'

/**
 * Sin la migración 0025 no hay dónde escribir ni qué leer.
 *
 * `PGRST202` y `42883` son la función que no existe; los demás, la tabla. Se
 * tratan igual: el registro se queda callado en vez de romper el panel.
 */
function esEstructuraAusente(codigo: string | undefined): boolean {
  return (
    codigo === 'PGRST205' ||
    codigo === '42P01' ||
    codigo === 'PGRST202' ||
    codigo === '42883' ||
    codigo === '42703'
  )
}

export interface ErrorAAnotar {
  donde: string
  mensaje: string
  codigo: string | null
  laboratorioId?: string | null
}

/**
 * Anota una ocurrencia, agrupada con las anteriores del mismo tipo.
 *
 * El mensaje se redacta y se recorta antes de salir: los mensajes de PostgreSQL
 * traen los valores que causaron el fallo, y en este sistema uno de esos valores
 * puede ser el nombre de un paciente. Un registro de errores no puede ser la
 * puerta por la que se escapan datos de salud.
 */
export async function anotarError(datos: ErrorAAnotar): Promise<void> {
  try {
    const mensaje = normalizarMensaje(redactar(datos.mensaje)) === '' ? 'sin mensaje' : datos.mensaje
    const admin = createAdminSupabase()
    const { data, error } = await admin.rpc('anotar_error', {
      p_huella: huellaDeError(datos.donde, datos.mensaje),
      p_donde: datos.donde.slice(0, 120),
      // Se guarda el mensaje concreto (redactado y recortado), no el
      // normalizado: para depurar hace falta el valor real, y agrupar ya lo
      // hace la huella.
      p_mensaje: redactar(mensaje).slice(0, 500),
      p_codigo: datos.codigo,
      p_laboratorio_id: datos.laboratorioId ?? null,
    })
    if (error) {
      if (!esEstructuraAusente(error.code)) {
        console.error(`[anotarError] ${error.code}: ${redactar(error.message)}`)
      }
      return
    }

    /*
      La base decide si toca avisar, y ya lo dejó sellado.

      Aquí solo se obedece: si esta petición se llevó el sello, manda el correo.
      Decidirlo en la aplicación haría que dos peticiones que fallan en el mismo
      segundo mandaran dos correos del mismo problema.
    */
    if (data === true) {
      await avisarDeError({
        donde: datos.donde,
        mensaje: redactar(mensaje).slice(0, 500),
        codigo: datos.codigo,
        laboratorioId: datos.laboratorioId ?? null,
      })
    }
  } catch (e) {
    // Consola y nada más. No hay a quién avisar de que falló el aviso.
    console.error('[anotarError] no se pudo anotar el error', e)
  }
}

/** Los tipos de error registrados, del más reciente al más antiguo. */
export async function erroresRegistrados(limite = 100): Promise<ErrorRegistrado[]> {
  try {
    const admin = createAdminSupabase()
    const { data, error } = await admin
      .from('error_registrado')
      .select(COLUMNAS)
      .order('ultima_vez', { ascending: false })
      .limit(limite)
    if (error) {
      if (esEstructuraAusente(error.code)) return []
      throw new Error(error.message)
    }
    return (data ?? []) as unknown as ErrorRegistrado[]
  } catch (e) {
    console.error('[erroresRegistrados] no se pudo leer el registro', e)
    return []
  }
}

/**
 * Marca un tipo de error como resuelto.
 *
 * No lo borra: si vuelve a ocurrir, la función `anotar_error` lo reabre, y esa
 * reapertura es información —significa que el arreglo no funcionó— que se
 * perdería si la fila hubiera desaparecido.
 */
export async function marcarErrorResuelto(huella: string): Promise<void> {
  const admin = createAdminSupabase()
  const { error } = await admin
    .from('error_registrado')
    .update({ resuelto_el: new Date().toISOString() })
    .eq('huella', huella)
  if (error && !esEstructuraAusente(error.code)) throw new Error(error.message)
}
