import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'
import { precioEfectivo, precioTotalTrabajo } from '@/lib/catalogo/precio'
import { resumenItems } from './resumen'
import type { EstadoEtapa, EstadoTrabajo } from './estado'
import type {
  Trabajo,
  TrabajoDetalle,
  TrabajoEtapa,
  TrabajoItem,
  TrabajoItemDetalle,
  TrabajoListItem,
} from './types'
import type { TrabajoInput } from './schema'

const SELECT_LIST =
  '*, doctor:doctor_id(nombre, consultorio:consultorio_id(nombre)), catalogo:catalogo_trabajo_id(nombre, categoria, variable_etiqueta), abonos:abono(monto), items:trabajo_item(cantidad, orden, catalogo:catalogo_trabajo_id(nombre))'

type ItemLite = { cantidad: number; orden: number; catalogo: { nombre: string } | null }

type Joined = Trabajo & {
  doctor: { nombre: string; consultorio: { nombre: string } | null } | null
  catalogo: { nombre: string; categoria: string; variable_etiqueta: string | null } | null
  abonos: { monto: number }[] | null
  items: ItemLite[] | null
}

function aListItem(row: Joined): TrabajoListItem {
  const total_pagado = (row.abonos ?? []).reduce((s, a) => s + a.monto, 0)
  const items = [...(row.items ?? [])].sort((a, b) => a.orden - b.orden)
  const tipo_nombre =
    items.length > 0
      ? resumenItems(items.map((i) => ({ cantidad: i.cantidad, nombre: i.catalogo?.nombre ?? '—' })))
      : (row.catalogo?.nombre ?? '—')
  return {
    ...row,
    doctor_nombre: row.doctor?.nombre ?? '—',
    consultorio_nombre: row.doctor?.consultorio?.nombre ?? '—',
    tipo_nombre,
    total_pagado,
    saldo: Math.round((row.precio_acordado - total_pagado) * 100) / 100,
  }
}

/**
 * Lista de trabajos del laboratorio. La búsqueda por texto y el conteo por
 * estado se hacen en memoria (ver `lib/trabajos/filtro.ts`): permite buscar en
 * varios campos a la vez y mostrar el conteo de cada filtro.
 */
export async function listTrabajos(opts?: {
  estado?: EstadoTrabajo
  doctorId?: string
}): Promise<TrabajoListItem[]> {
  const supabase = await createServerSupabase()
  let query = supabase.from('trabajo').select(SELECT_LIST)
  if (opts?.estado) query = query.eq('estado', opts.estado)
  if (opts?.doctorId) query = query.eq('doctor_id', opts.doctorId)
  const { data, error } = await query
    .order('fecha_ingreso', { ascending: false })
    .order('creado_en', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as Joined[]).map(aListItem)
}

const SELECT_DETALLE =
  '*, doctor:doctor_id(nombre, consultorio:consultorio_id(nombre)), catalogo:catalogo_trabajo_id(nombre, categoria, variable_etiqueta), abonos:abono(monto), items:trabajo_item(*, catalogo:catalogo_trabajo_id(nombre, variable_etiqueta)), etapas:trabajo_etapa(*)'

type ItemJoined = TrabajoItem & {
  catalogo: { nombre: string; variable_etiqueta: string | null } | null
}

export async function getTrabajo(id: string): Promise<TrabajoDetalle | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('trabajo')
    .select(SELECT_DETALLE)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const row = data as unknown as Joined & {
    items: ItemJoined[]
    etapas: TrabajoEtapa[]
  }
  const etapas = [...(row.etapas ?? [])].sort((a, b) => a.orden - b.orden)
  const items: TrabajoItemDetalle[] = [...(row.items ?? [])]
    .sort((a, b) => a.orden - b.orden)
    .map((i) => ({
      ...i,
      tipo_nombre: i.catalogo?.nombre ?? '—',
      variable_etiqueta: i.catalogo?.variable_etiqueta ?? null,
    }))
  return {
    ...aListItem(row as unknown as Joined),
    variable_etiqueta: row.catalogo?.variable_etiqueta ?? null,
    etapas,
    items,
  }
}

interface LineaCalculada {
  catalogo_trabajo_id: string
  cantidad: number
  variable_cantidad: number
  pieza: string | null
  precio_unitario: number
  subtotal: number
  orden: number
}

/** Valora cada línea con el catálogo y devuelve las líneas + el total de la cuenta. */
async function valorarLineas(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  input: TrabajoInput,
): Promise<{ lineas: LineaCalculada[]; total: number }> {
  const ids = [...new Set(input.items.map((i) => i.catalogo_trabajo_id))]
  const { data: cats, error } = await supabase
    .from('catalogo_trabajo')
    .select('id, precio_base, variable_precio_unitario')
    .in('id', ids)
  if (error) throw new Error(error.message)
  type Cat = { id: string; precio_base: number; variable_precio_unitario: number | null }
  const porId = new Map((cats as Cat[]).map((c) => [c.id, c]))
  if (porId.size !== ids.length) throw new Error('Tipo de trabajo no encontrado')

  const lineas = input.items.map((it, idx) => {
    const cat = porId.get(it.catalogo_trabajo_id)!
    return {
      catalogo_trabajo_id: it.catalogo_trabajo_id,
      cantidad: it.cantidad,
      variable_cantidad: it.variable_cantidad,
      pieza: it.pieza,
      precio_unitario: Math.round(precioEfectivo(cat, it.variable_cantidad) * 100) / 100,
      subtotal: precioTotalTrabajo(cat, it.cantidad, it.variable_cantidad),
      orden: idx + 1,
    }
  })
  const total = Math.round(lineas.reduce((s, l) => s + l.subtotal, 0) * 100) / 100
  return { lineas, total }
}

/** Crea una cuenta: calcula precios, guarda las líneas y copia las etapas. */
export async function crearTrabajo(input: TrabajoInput): Promise<string> {
  const supabase = await createServerSupabase()
  const laboratorioId = await laboratorioIdActual()
  const { lineas, total } = await valorarLineas(supabase, input)
  const precio = input.precio_manual ?? total
  const totalPiezas = lineas.reduce((s, l) => s + l.cantidad, 0)

  const { data: nuevo, error } = await supabase
    .from('trabajo')
    .insert({
      laboratorio_id: laboratorioId,
      doctor_id: input.doctor_id,
      catalogo_trabajo_id: lineas[0].catalogo_trabajo_id,
      paciente_nombre: input.paciente_nombre,
      pieza: null,
      fecha_entrega: input.fecha_entrega,
      cantidad: totalPiezas,
      variable_cantidad: lineas[0].variable_cantidad,
      precio_acordado: precio,
      notas: input.notas,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  const trabajoId = (nuevo as { id: string }).id

  // Si algo falla después de crear la cabecera, se borra para no dejar
  // cuentas incompletas (las líneas y etapas caen por cascada).
  try {
    const { error: iErr } = await supabase.from('trabajo_item').insert(
      lineas.map((l) => ({ ...l, laboratorio_id: laboratorioId, trabajo_id: trabajoId })),
    )
    if (iErr) throw new Error(iErr.message)

    // Copiar etapas de las plantillas de todos los tipos (sin repetir tipos).
    const tiposUnicos = [...new Set(lineas.map((l) => l.catalogo_trabajo_id))]
    const { data: plantilla } = await supabase
      .from('plantilla_etapa')
      .select('catalogo_trabajo_id, nombre, orden')
      .in('catalogo_trabajo_id', tiposUnicos)
      .order('orden', { ascending: true })

    if (plantilla && plantilla.length > 0) {
      type Pe = { catalogo_trabajo_id: string; nombre: string; orden: number }
      let n = 0
      const filas = tiposUnicos.flatMap((tipoId) =>
        (plantilla as Pe[])
          .filter((e) => e.catalogo_trabajo_id === tipoId)
          .map((e) => ({
            laboratorio_id: laboratorioId,
            trabajo_id: trabajoId,
            nombre: e.nombre,
            orden: ++n,
            estado: 'pendiente' as EstadoEtapa,
          })),
      )
      const { error: eErr } = await supabase.from('trabajo_etapa').insert(filas)
      if (eErr) throw new Error(eErr.message)
    }
  } catch (e: unknown) {
    await supabase.from('trabajo').delete().eq('id', trabajoId)
    throw e instanceof Error ? e : new Error('No se pudo crear el trabajo')
  }

  return trabajoId
}

/** Edita la cuenta: reemplaza las líneas y recalcula el precio. No toca las etapas. */
export async function editarTrabajo(
  id: string,
  input: TrabajoInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const laboratorioId = await laboratorioIdActual()
  const { lineas, total } = await valorarLineas(supabase, input)
  const precio = input.precio_manual ?? total
  const totalPiezas = lineas.reduce((s, l) => s + l.cantidad, 0)

  const { error } = await supabase
    .from('trabajo')
    .update({
      doctor_id: input.doctor_id,
      catalogo_trabajo_id: lineas[0].catalogo_trabajo_id,
      paciente_nombre: input.paciente_nombre,
      pieza: null,
      fecha_entrega: input.fecha_entrega,
      cantidad: totalPiezas,
      variable_cantidad: lineas[0].variable_cantidad,
      precio_acordado: precio,
      notas: input.notas,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)

  // Insertar primero y borrar después: si el insert falla, la cuenta conserva
  // sus líneas anteriores (no queda vacía). Las nuevas van con orden negativo
  // para no chocar y se normalizan al final.
  const { data: insertadas, error: iErr } = await supabase
    .from('trabajo_item')
    .insert(
      lineas.map((l) => ({
        ...l,
        orden: -l.orden,
        laboratorio_id: laboratorioId,
        trabajo_id: id,
      })),
    )
    .select('id, orden')
  if (iErr) throw new Error(iErr.message)

  const nuevasIds = (insertadas as { id: string; orden: number }[]) ?? []
  const { error: dErr } = await supabase
    .from('trabajo_item')
    .delete()
    .eq('trabajo_id', id)
    .not('id', 'in', `(${nuevasIds.map((r) => r.id).join(',')})`)
  if (dErr) throw new Error(dErr.message)

  for (const fila of nuevasIds) {
    const { error } = await supabase
      .from('trabajo_item')
      .update({ orden: Math.abs(fila.orden) })
      .eq('id', fila.id)
    if (error) throw new Error(error.message)
  }
}

export async function eliminarTrabajo(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('trabajo').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Cambia el estado del trabajo y mantiene al día su fecha real de entrega.
 *
 * `hoy` se recibe en vez de leerlo del reloj para que la lógica sea probable y
 * para que la fecha sea la de Lima y no la de la zona horaria del servidor.
 *
 * Van tres sentencias y no una porque las condiciones son distintas:
 * - Al entregar se sella **solo si estaba vacía** (`is('entregado_el', null)`).
 *   Volver a pulsar «Entregado» no debe pisar una fecha que un administrador
 *   corrigió a mano.
 * - Al salir de entregado se borra: dejar el sello registraría una entrega que
 *   se deshizo.
 */
export async function cambiarEstadoTrabajo(
  id: string,
  estado: EstadoTrabajo,
  hoy: string,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('trabajo').update({ estado }).eq('id', id)
  if (error) throw new Error(error.message)

  if (estado === 'entregado') {
    const { error: errSello } = await supabase
      .from('trabajo')
      .update({ entregado_el: hoy })
      .eq('id', id)
      .is('entregado_el', null)
    if (errSello) throw new Error(errSello.message)
    return
  }

  const { error: errBorrado } = await supabase
    .from('trabajo')
    .update({ entregado_el: null })
    .eq('id', id)
    .not('entregado_el', 'is', null)
  if (errBorrado) throw new Error(errBorrado.message)
}

/**
 * Corrige la fecha real de entrega.
 *
 * Existe porque en el laboratorio se marcan varios trabajos de golpe, días
 * después de que salieran: sin poder corregirla, el sello automático guardaría
 * el día en que alguien se acordó de marcarlo, no el de la entrega.
 */
export async function corregirFechaEntrega(id: string, fecha: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from('trabajo')
    .update({ entregado_el: fecha })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function marcarEtapa(
  id: string,
  estado: EstadoEtapa,
  motivo?: string | null,
): Promise<void> {
  const supabase = await createServerSupabase()
  const cerrada = estado === 'completada' || estado === 'excluida'
  const { error } = await supabase
    .from('trabajo_etapa')
    .update({
      estado,
      motivo_exclusion: estado === 'excluida' ? (motivo ?? null) : null,
      fecha_cierre: cerrada ? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
