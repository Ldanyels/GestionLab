/**
 * Envoltorios para Server Actions.
 *
 * El problema que resuelven: la capa de datos relanza los errores de Supabase
 * (`if (error) throw new Error(error.message)`) y las acciones no los
 * capturaban. La excepción escapaba al límite de error por defecto de Next, el
 * usuario veía una pantalla cruda y —lo peor— perdía todo lo que había escrito
 * en el formulario.
 *
 * Cuidado con `redirect()`: Next lo implementa lanzando una excepción. Un
 * `try/catch` que la trate como error rompe la navegación en silencio, con el
 * guardado ya hecho. Los dos envoltorios de aquí la relanzan siempre, y por eso
 * conviene usarlos en vez de escribir el `try/catch` a mano en cada acción.
 */
import { esControlDeFlujoDeNext } from './errores'
import { registrarError } from './registro'

export interface FormState {
  error: string
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; estado: FormState }

/**
 * Para acciones con `useActionState`: si la operación falla, devuelve el error
 * como estado del formulario y el usuario conserva lo que escribió.
 *
 *   const r = await intentar('crearTrabajoAction', 'No se pudo guardar el trabajo',
 *     () => crearTrabajo(datos))
 *   if (!r.ok) return r.estado
 *   revalidatePath('/trabajos')
 *   redirect(`/trabajos/${r.valor}`)   // el redirect va FUERA del envoltorio
 */
export async function intentar<T>(
  donde: string,
  respaldo: string,
  operacion: () => Promise<T>,
): Promise<Resultado<T>> {
  try {
    return { ok: true, valor: await operacion() }
  } catch (e) {
    if (esControlDeFlujoDeNext(e)) throw e
    return { ok: false, estado: { error: registrarError(donde, e, respaldo) } }
  }
}

/**
 * Para acciones sin estado de formulario (borrar, archivar, cambiar estado):
 * registra el fallo y relanza el error original para que lo tome el `error.tsx`
 * de la ruta. Se relanza el original, no uno nuevo, para no perder la traza; en
 * producción Next no expone su mensaje al navegador, solo un identificador que
 * se cruza con el registro.
 */
export async function intentarSinEstado(
  donde: string,
  respaldo: string,
  operacion: () => Promise<void>,
): Promise<void> {
  try {
    await operacion()
  } catch (e) {
    if (esControlDeFlujoDeNext(e)) throw e
    registrarError(donde, e, respaldo)
    throw e
  }
}
