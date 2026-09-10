import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'
import { detalleDeEdicion } from './detalle'
import type { Abono } from './types'
import type { AbonoInput } from './schema'
import { filasReporte } from '@/lib/reportes/data'
import { ErrorParaElUsuario } from '@/lib/errores'

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

/** Un trabajo pendiente listo para que alguien decida si este pago lo cubre. */
export interface TrabajoCobrable {
  trabajo_id: string
  paciente: string | null
  resumen: string
  fecha_ingreso: string
  total: number
  pagado: number
  saldo: number
}

/**
 * Los trabajos con saldo de un consultorio, del más antiguo al más nuevo.
 *
 * Reutiliza `filasReporte`, que ya sabe filtrar por consultorio y traer los
 * abonos de cada trabajo en la misma consulta. Escribir otra consulta aquí
 * habría duplicado el join y la forma de calcular lo pagado, que es justo donde
 * dos versiones se desincronizan sin que nadie lo note.
 */
export async function trabajosCobrablesDeConsultorio(
  consultorioId: string,
): Promise<TrabajoCobrable[]> {
  const filas = await filasReporte({ consultorioId })
  return filas
    .map((f) => ({
      trabajo_id: f.id,
      paciente: f.paciente,
      resumen: f.resumen,
      fecha_ingreso: f.fecha_ingreso,
      total: f.total,
      pagado: f.pagado,
      saldo: Math.round((f.total - f.pagado) * 100) / 100,
    }))
    .filter((f) => f.saldo > 0.001)
}

/**
 * Registra un pago repartido entre varios trabajos.
 *
 * Un `insert` con todas las filas y no uno por trabajo: PostgREST lo manda como
 * una sola sentencia, así que o entran todos los abonos o no entra ninguno. Con
 * inserciones sueltas, un fallo a la mitad dejaría un pago registrado por
 * partes y un saldo que no cuadra con nada.
 *
 * Todos comparten `cobro_id`, que es lo que permite deshacer el pago completo
 * en un solo paso en vez de borrar doce abonos uno por uno.
 *
 * Devuelve el `cobro_id`.
 */
export async function registrarCobroAgrupado(
  lineas: readonly { trabajo_id: string; monto: number }[],
  datos: { metodo: string; fecha: string | null; nota: string | null },
): Promise<string> {
  const supabase = await createServerSupabase()
  const laboratorioId = await laboratorioIdActual()
  const cobroId = crypto.randomUUID()

  const { error } = await supabase.from('abono').insert(
    lineas.map((l) => ({
      trabajo_id: l.trabajo_id,
      laboratorio_id: laboratorioId,
      monto: l.monto,
      metodo: datos.metodo,
      ...(datos.fecha ? { fecha: datos.fecha } : {}),
      nota: datos.nota,
      cobro_id: cobroId,
    })),
  )
  // 42703 es `cobro_id` sin la migración 0027. Se avisa en claro en vez de
  // dejar el mensaje crudo de Postgres, que aquí no dice nada al usuario.
  if (error) {
    if (error.code === '42703') {
      throw new ErrorParaElUsuario(
        'Falta aplicar la migración 0027 en la base para registrar pagos agrupados',
      )
    }
    throw new Error(error.message)
  }

  return cobroId
}

/** Los abonos de un pago agrupado, para poder mostrarlo y deshacerlo. */
export async function abonosDelCobro(cobroId: string): Promise<Abono[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('abono')
    .select('*')
    .eq('cobro_id', cobroId)
    .order('fecha', { ascending: true })
  if (error) {
    if (error.code === '42703') return []
    throw new Error(error.message)
  }
  return (data ?? []) as unknown as Abono[]
}

/**
 * Deshace un pago completo.
 *
 * Existe porque un pago mal registrado son varios abonos, y borrarlos uno a
 * uno —doce, en el caso de Arte oral— es donde se queda uno a medias y deja los
 * saldos peor que antes.
 */
export async function eliminarCobro(cobroId: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('abono').delete().eq('cobro_id', cobroId)
  if (error) throw new Error(error.message)
}
