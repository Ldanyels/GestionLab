import { createServerSupabase } from '@/lib/supabase/server'
import { resumenItems } from './resumen'
import { aplicarFiltros, rangoDePagina, VISTA, type FiltrosDeListado } from './listado'
import type { ConteoEstados } from './filtro'
import type { EstadoTrabajo } from './estado'
import type { TrabajoListItem } from './types'

/**
 * Una página de la lista de trabajos, con sus contadores.
 *
 * Todo se resuelve en la base: la página trae solo las filas que se ven y cada
 * contador es una consulta que **no devuelve ninguna fila**. Antes se traía la
 * lista completa —0,97 KB por trabajo— y se filtraba y contaba en memoria; a 18
 * trabajos diarios eso llegaba a 5,7 MB por pantalla en un año.
 */

/*
  Las columnas que necesita la tarjeta. `busqueda` queda fuera a propósito: es
  un texto largo que solo sirve para filtrar en la base, y enviarlo al teléfono
  desharía buena parte de lo que ahorra la paginación.
*/
const COLUMNAS =
  'id, laboratorio_id, doctor_id, catalogo_trabajo_id, paciente_nombre, pieza, fecha_ingreso, fecha_entrega, entregado_el, estado, precio_acordado, cantidad, variable_cantidad, notas, creado_en, doctor_nombre, consultorio_id, consultorio_nombre, total_pagado, saldo'

export interface PaginaDeTrabajos {
  trabajos: TrabajoListItem[]
  /** Cuántos hay en total con estos filtros, para saber cuántas páginas son. */
  total: number
  conteoEstado: ConteoEstados
  conteoPago: { cualquiera: number; por_cobrar: number; pagados: number }
}

/** Cuenta sin traer filas: `head: true` devuelve solo el total. */
async function contar(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  f: FiltrosDeListado,
): Promise<number> {
  const base = supabase.from(VISTA).select('id', { count: 'exact', head: true })
  const { count, error } = await aplicarFiltros(base, f)
  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * El nombre que se muestra: «2× Corona + 1× Perno».
 *
 * Se arma aquí y no en la vista porque `resumenItems` ya tiene ese formato
 * probado; duplicarlo en SQL crearía dos versiones que se separarían con el
 * tiempo. Cuesta una consulta más, pero solo por las filas visibles.
 */
async function nombresDeTipo(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()

  const { data, error } = await supabase
    .from('trabajo_item')
    .select('trabajo_id, cantidad, orden, catalogo:catalogo_trabajo_id(nombre)')
    .in('trabajo_id', ids)
  if (error) throw new Error(error.message)

  type Fila = {
    trabajo_id: string
    cantidad: number
    orden: number
    catalogo: { nombre: string } | { nombre: string }[] | null
  }
  const porTrabajo = new Map<string, { cantidad: number; nombre: string; orden: number }[]>()
  for (const bruto of (data ?? []) as unknown as Fila[]) {
    const cat = Array.isArray(bruto.catalogo) ? bruto.catalogo[0] : bruto.catalogo
    const lista = porTrabajo.get(bruto.trabajo_id) ?? []
    lista.push({ cantidad: bruto.cantidad, nombre: cat?.nombre ?? '—', orden: bruto.orden })
    porTrabajo.set(bruto.trabajo_id, lista)
  }

  const nombres = new Map<string, string>()
  for (const [id, lineas] of porTrabajo) {
    nombres.set(
      id,
      resumenItems(
        [...lineas]
          .sort((a, b) => a.orden - b.orden)
          .map((l) => ({ cantidad: l.cantidad, nombre: l.nombre })),
      ),
    )
  }
  return nombres
}

export async function paginaDeTrabajos(
  filtros: FiltrosDeListado,
  pagina: number,
): Promise<PaginaDeTrabajos> {
  const supabase = await createServerSupabase()
  const [desde, hasta] = rangoDePagina(pagina)

  const conEstado = (estado: EstadoTrabajo | null) => ({ ...filtros, estado })
  const conPago = (pago: FiltrosDeListado['pago']) => ({ ...filtros, pago })

  /*
    Los nueve viajes van en paralelo: el conjunto tarda lo que el más lento, no
    la suma. Encadenados serían más de un segundo antes de pintar nada.

    Ocho de ellos son conteos con `head: true`, que no devuelven ninguna fila.
    El noveno trae las treinta que se ven.

    Cada contador se calcula con **los demás filtros puestos**, así que ningún
    número promete resultados que su botón no vaya a devolver. Y como todos
    pasan por `aplicarFiltros` —la misma función que arma la lista—, esa
    correspondencia se cumple por construcción y no por disciplina.
  */
  const [filas, total, todos, enCurso, cerrado, entregado, cualquiera, porCobrar, pagados] =
    await Promise.all([
      aplicarFiltros(supabase.from(VISTA).select(COLUMNAS), filtros)
        .order('fecha_ingreso', { ascending: false })
        .order('creado_en', { ascending: false })
        .range(desde, hasta),
      contar(supabase, filtros),
      contar(supabase, conEstado(null)),
      contar(supabase, conEstado('en_curso')),
      contar(supabase, conEstado('cerrado')),
      contar(supabase, conEstado('entregado')),
      contar(supabase, conPago('cualquiera')),
      contar(supabase, conPago('por_cobrar')),
      contar(supabase, conPago('pagados')),
    ])

  if (filas.error) throw new Error(filas.error.message)
  const datos = (filas.data ?? []) as unknown as Omit<TrabajoListItem, 'tipo_nombre'>[]
  const nombres = await nombresDeTipo(
    supabase,
    datos.map((t) => t.id),
  )

  return {
    trabajos: datos.map((t) => ({
      ...t,
      // Sin líneas propias es un trabajo de los antiguos, de un solo tipo; la
      // consulta de nombres no devuelve nada y se muestra un guion.
      tipo_nombre: nombres.get(t.id) ?? '—',
    })) as TrabajoListItem[],
    total,
    conteoEstado: { todos, en_curso: enCurso, cerrado, entregado },
    conteoPago: { cualquiera, por_cobrar: porCobrar, pagados },
  }
}

/**
 * Los saldos de todo lo filtrado, para el importe del resumen.
 *
 * Trae **una sola columna numérica** y ninguna otra: unos 18 bytes por fila
 * frente a los 970 de la fila completa. A 6.500 trabajos son 118 KB en vez de
 * 5,7 MB.
 *
 * Sigue creciendo con el total, y esa es la pieza que habrá que mover a la base
 * el día que un laboratorio pase de unos miles de trabajos. Hoy no se puede:
 * este proyecto tiene deshabilitadas las funciones de agregación de PostgREST,
 * así que sumar en el servidor exigiría una función SQL con los filtros
 * duplicados —y dos copias de las reglas de filtrado acabarían discrepando.
 *
 * Usa `aplicarFiltros`, la misma que la lista y los contadores: el importe no
 * puede corresponder a un conjunto distinto del que se muestra.
 */
export async function saldosFiltrados(filtros: FiltrosDeListado): Promise<number[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await aplicarFiltros(
    supabase.from(VISTA).select('saldo'),
    filtros,
  )
  if (error) throw new Error(error.message)
  return (data ?? []).map((f) => Number((f as { saldo: number }).saldo))
}
