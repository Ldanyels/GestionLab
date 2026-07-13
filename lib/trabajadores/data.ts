import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'
import type {
  MontoEstandarItem,
  PagoTrabajador,
  Trabajador,
  TrabajadorDetalle,
} from './types'
import type {
  MontoEstandarInput,
  PagoTrabajadorInput,
  TrabajadorInput,
} from './schema'

export async function listTrabajadores(): Promise<Trabajador[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('trabajador')
    .select('*')
    .order('nombre', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Trabajador[]
}

export async function getTrabajador(id: string): Promise<TrabajadorDetalle | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('trabajador')
    .select(
      '*, montos:monto_estandar(id, catalogo_trabajo_id, monto, catalogo:catalogo_trabajo_id(nombre)), pagos:pago_trabajador(*)',
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  type MontoRow = {
    id: string
    catalogo_trabajo_id: string
    monto: number
    catalogo: { nombre: string } | null
  }
  const row = data as Trabajador & {
    montos: MontoRow[]
    pagos: PagoTrabajador[]
  }
  const montos: MontoEstandarItem[] = (row.montos ?? []).map((m) => ({
    id: m.id,
    catalogo_trabajo_id: m.catalogo_trabajo_id,
    monto: m.monto,
    tipo_nombre: m.catalogo?.nombre ?? '—',
  }))
  const pagos = [...(row.pagos ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const total_pagado = pagos.reduce((s, p) => s + p.monto, 0)
  return { ...row, montos, pagos, total_pagado }
}

export async function crearTrabajador(input: TrabajadorInput): Promise<string> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('trabajador')
    .insert({ nombre: input.nombre, laboratorio_id: await laboratorioIdActual() })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return (data as { id: string }).id
}

export async function editarTrabajador(id: string, input: TrabajadorInput): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('trabajador').update({ nombre: input.nombre }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarTrabajador(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('trabajador').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function crearPago(
  trabajadorId: string,
  input: PagoTrabajadorInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('pago_trabajador').insert({
    laboratorio_id: await laboratorioIdActual(),
    trabajador_id: trabajadorId,
    monto: input.monto,
    nota: input.nota,
    catalogo_trabajo_id: input.catalogo_trabajo_id,
    ...(input.fecha ? { fecha: input.fecha } : {}),
  })
  if (error) throw new Error(error.message)
}

export async function eliminarPago(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('pago_trabajador').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function guardarMontoEstandar(
  trabajadorId: string,
  input: MontoEstandarInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('monto_estandar').upsert(
    {
      laboratorio_id: await laboratorioIdActual(),
      trabajador_id: trabajadorId,
      catalogo_trabajo_id: input.catalogo_trabajo_id,
      monto: input.monto,
    },
    { onConflict: 'trabajador_id,catalogo_trabajo_id' },
  )
  if (error) throw new Error(error.message)
}

export async function eliminarMontoEstandar(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('monto_estandar').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Suma de pagos a trabajadores en un rango de fechas [desde, hasta] (para Finanzas). */
export async function totalPagadoTrabajadores(
  desde: string,
  hasta: string,
): Promise<number> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('pago_trabajador')
    .select('monto')
    .gte('fecha', desde)
    .lte('fecha', hasta)
  if (error) throw new Error(error.message)
  return (data ?? []).reduce((s, p) => s + (p as { monto: number }).monto, 0)
}
