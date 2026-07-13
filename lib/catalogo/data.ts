import { createServerSupabase } from '@/lib/supabase/server'
import { laboratorioIdActual } from '@/lib/tenant'
import type { CatalogoTrabajo, CatalogoConEtapas, PlantillaEtapa } from './types'
import type { CatalogoInput, EtapaInput } from './schema'

export async function listCatalogo(): Promise<CatalogoTrabajo[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('catalogo_trabajo')
    .select('*')
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as CatalogoTrabajo[]
}

export async function getCatalogoItem(
  id: string,
): Promise<CatalogoConEtapas | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('catalogo_trabajo')
    .select('*, etapas:plantilla_etapa(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const row = data as CatalogoTrabajo & { etapas: PlantillaEtapa[] }
  const etapas = [...(row.etapas ?? [])].sort((a, b) => a.orden - b.orden)
  return { ...row, etapas }
}

export async function crearCatalogo(input: CatalogoInput): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from('catalogo_trabajo')
    .insert({ ...input, laboratorio_id: await laboratorioIdActual() })
  if (error) throw new Error(error.message)
}

export async function editarCatalogo(
  id: string,
  input: CatalogoInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('catalogo_trabajo').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarCatalogo(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('catalogo_trabajo').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Plantillas de etapas ────────────────────────────────────

export async function crearEtapa(
  catalogoId: string,
  input: EtapaInput,
): Promise<void> {
  const supabase = await createServerSupabase()
  const { data: maxRow } = await supabase
    .from('plantilla_etapa')
    .select('orden')
    .eq('catalogo_trabajo_id', catalogoId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()
  const orden = (maxRow?.orden ?? 0) + 1
  const { error } = await supabase.from('plantilla_etapa').insert({
    ...input,
    catalogo_trabajo_id: catalogoId,
    orden,
    laboratorio_id: await laboratorioIdActual(),
  })
  if (error) throw new Error(error.message)
}

export async function editarEtapa(id: string, input: EtapaInput): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('plantilla_etapa').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarEtapa(id: string): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('plantilla_etapa').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Intercambia el orden de dos etapas (mover arriba/abajo). */
export async function intercambiarOrdenEtapas(
  a: { id: string; orden: number },
  b: { id: string; orden: number },
): Promise<void> {
  const supabase = await createServerSupabase()
  const e1 = await supabase.from('plantilla_etapa').update({ orden: b.orden }).eq('id', a.id)
  if (e1.error) throw new Error(e1.error.message)
  const e2 = await supabase.from('plantilla_etapa').update({ orden: a.orden }).eq('id', b.id)
  if (e2.error) throw new Error(e2.error.message)
}
