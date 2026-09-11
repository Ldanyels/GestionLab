import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { laboratorioIdActual } from '@/lib/tenant'
import { ErrorParaElUsuario } from '@/lib/errores'
import { registrarError } from '@/lib/registro'
import { BUCKET, type FotoConEnlace, type FotoDeTrabajo } from './tipos'

export { BUCKET }
export type { FotoConEnlace, FotoDeTrabajo }
import {
  estaVencida,
  huecoLibre,
  MESES_DE_CONSERVACION,
  type MomentoFoto,
} from './reglas'

/**
 * Cuánto vive un enlace de foto.
 *
 * Una hora: lo suficiente para mirar una ficha con calma, poco para que un
 * enlace copiado a un chat siga sirviendo mañana. Son datos de salud, y la
 * política de privacidad promete enlaces temporales.
 */
const SEGUNDOS_DE_ENLACE = 3600

/** Sin la migración 0029 no hay tabla; la ficha del trabajo sigue abriendo. */
function esTablaAusente(codigo: string | undefined): boolean {
  return codigo === 'PGRST205' || codigo === '42P01'
}

export async function fotosDeTrabajo(trabajoId: string): Promise<FotoDeTrabajo[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('foto_trabajo')
    .select('id, trabajo_id, momento, orden, ruta, creado_en')
    .eq('trabajo_id', trabajoId)
    .order('momento')
    .order('orden')
  if (error) {
    if (esTablaAusente(error.code)) return []
    throw new Error(error.message)
  }
  return (data ?? []) as unknown as FotoDeTrabajo[]
}

/**
 * Las fotos con su enlace temporal, listas para mostrar.
 *
 * Se firman todas de una vez y no una por una: con cuatro fotos serían cuatro
 * viajes de red antes de pintar la ficha.
 */
export async function fotosConEnlace(trabajoId: string): Promise<FotoConEnlace[]> {
  const fotos = await fotosDeTrabajo(trabajoId)
  if (fotos.length === 0) return []

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(fotos.map((f) => f.ruta), SEGUNDOS_DE_ENLACE)

  if (error) {
    // Sin enlaces se muestra la ficha igual, con un hueco donde iría la foto.
    // Peor sería no poder abrir el trabajo por una imagen que no cargó.
    registrarError('fotosConEnlace', error, 'No se pudieron cargar las fotos')
    return fotos.map((f) => ({ ...f, url: null }))
  }

  const porRuta = new Map((data ?? []).map((d) => [d.path, d.signedUrl]))
  return fotos.map((f) => ({ ...f, url: porRuta.get(f.ruta) ?? null }))
}

/**
 * Reserva la posición y devuelve dónde subir el archivo.
 *
 * Se inserta la fila **antes** de que el navegador suba: si dos personas suben
 * a la vez, el índice único decide cuál se queda con la posición y la otra
 * recibe un mensaje claro en vez de dejar dos archivos peleando por el mismo
 * nombre.
 */
export async function reservarFoto(
  trabajoId: string,
  momento: MomentoFoto,
  ruta: string,
  orden: number,
): Promise<string> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('foto_trabajo')
    .insert({
      laboratorio_id: await laboratorioIdActual(),
      trabajo_id: trabajoId,
      momento,
      orden,
      ruta,
    })
    .select('id')
    .single()

  if (error) {
    // 23505 es el índice único: alguien se llevó la posición primero.
    if (error.code === '23505') {
      throw new ErrorParaElUsuario('Otra persona acaba de subir esa foto. Vuelve a intentar.')
    }
    throw new Error(error.message)
  }
  return (data as { id: string }).id
}

/** Qué posición está libre para el siguiente archivo de ese momento. */
export async function siguienteHueco(
  trabajoId: string,
  momento: MomentoFoto,
): Promise<number | null> {
  const fotos = await fotosDeTrabajo(trabajoId)
  return huecoLibre(fotos.filter((f) => f.momento === momento).map((f) => f.orden))
}

/**
 * Borra una foto: primero el archivo, después la fila.
 *
 * En ese orden a propósito. Si falla el archivo, la fila sigue y se puede
 * reintentar; al revés, la fila desaparecería y el archivo quedaría huérfano en
 * el almacenamiento, invisible y cobrando espacio para siempre.
 */
export async function eliminarFoto(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('foto_trabajo')
    .select('ruta')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return

  const ruta = (data as { ruta: string }).ruta
  const { error: errArchivo } = await supabase.storage.from(BUCKET).remove([ruta])
  if (errArchivo) throw new Error(errArchivo.message)

  const { error: errFila } = await supabase.from('foto_trabajo').delete().eq('id', id)
  if (errFila) throw new Error(errFila.message)
}

/**
 * Borra las fotos que pasaron de los 6 meses.
 *
 * Va por la clave de servicio porque debe alcanzar a **todos** los laboratorios
 * y no solo al de quien abrió una pantalla. Es una obligación que el contrato de
 * encargo pone sobre el proveedor, no un favor que dependa de que alguien entre.
 *
 * **No lanza.** Si falla, se reintenta la próxima vez; que el panel no abra por
 * una limpieza sería peor.
 *
 * Devuelve cuántas borró.
 */
export async function borrarFotosVencidas(ahora = new Date().toISOString()): Promise<number> {
  try {
    const admin = createAdminSupabase()
    const { data, error } = await admin
      .from('foto_trabajo')
      .select('id, ruta, creado_en')
      // Se filtra en la base por fecha y se confirma con la misma regla que usa
      // el resto del sistema: una sola definición de «vencida».
      .lt('creado_en', ahora)
      .order('creado_en')
      .limit(500)
    if (error) {
      if (esTablaAusente(error.code)) return 0
      throw new Error(error.message)
    }

    const vencidas = (data ?? []).filter((f) =>
      estaVencida((f as { creado_en: string }).creado_en, ahora),
    ) as unknown as { id: string; ruta: string }[]
    if (vencidas.length === 0) return 0

    const { error: errArchivos } = await admin.storage
      .from(BUCKET)
      .remove(vencidas.map((f) => f.ruta))
    if (errArchivos) throw new Error(errArchivos.message)

    const { error: errFilas } = await admin
      .from('foto_trabajo')
      .delete()
      .in('id', vencidas.map((f) => f.id))
    if (errFilas) throw new Error(errFilas.message)

    return vencidas.length
  } catch (e) {
    registrarError(
      'borrarFotosVencidas',
      e,
      `No se pudieron borrar las fotos de más de ${MESES_DE_CONSERVACION} meses`,
    )
    return 0
  }
}
