import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'
import { detalleDeEdicion } from './detalle'
import type { Abono } from './types'
import type { AbonoInput } from './schema'

export async function listAbonos(trabajoId: string): Promise<Abono[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('abono')
    .select('*')
    .eq('trabajo_id', trabajoId)
    .order('fecha', { ascending: true })
    .order('creado_en', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Abono[]
}

export async function crearAbono(
  trabajoId: string,
  input: AbonoInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('abono').insert({
    trabajo_id: trabajoId,
    laboratorio_id: await laboratorioIdActual(),
    monto: input.monto,
    metodo: input.metodo,
    ...(input.fecha ? { fecha: input.fecha } : {}),
    nota: input.nota,
  })
  if (error) throw new Error(error.message)
}

/**
 * Corrige un abono ya registrado.
 *
 * Devuelve el detalle de lo que cambió, o cadena vacía si no cambió nada. El
 * llamador lo usa para anotarlo en el historial.
 *
 * Lee la fila antes de tocarla por dos razones que se refuerzan: para conocer
 * los valores anteriores, y porque leerla con el cliente del usuario es lo que
 * confirma que ese abono es de su laboratorio —la política RLS de `abono` no
 * deja ver los ajenos—. Si no aparece, no se toca nada.
 */
export async function editarAbono(
  id: string,
  input: AbonoInput,
): Promise<{ detalle: string; trabajoId: string } | null> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('abono')
    .select('id, trabajo_id, monto, metodo, fecha, nota')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const antes = data as unknown as {
    trabajo_id: string
    monto: number
    metodo: string
    fecha: string | null
    nota: string | null
  }

  const despues = {
    monto: input.monto,
    metodo: input.metodo,
    // Sin fecha escrita se conserva la que tenía: vaciarla no es una
    // corrección que la pantalla ofrezca.
    fecha: input.fecha ?? antes.fecha,
    nota: input.nota,
  }

  const detalle = detalleDeEdicion(antes, despues)
  if (!detalle) return { detalle: '', trabajoId: antes.trabajo_id }

  const { error: errUpdate } = await supabase.from('abono').update(despues).eq('id', id)
  if (errUpdate) throw new Error(errUpdate.message)

  return { detalle, trabajoId: antes.trabajo_id }
}

export async function eliminarAbono(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('abono').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
