import { createServerSupabase } from '@/lib/supabase/server'
import { desdeQueFecha, hayCoincidencia, type TrabajoComparable } from './duplicados'

/**
 * Busca trabajos que puedan ser el mismo que se está registrando.
 *
 * El acotado lo hace la base por consultorio y fecha —cinco días de un solo
 * consultorio son un puñado de filas— y el paciente y los tipos se comparan en
 * memoria, porque la coincidencia de nombres necesita normalizar tildes y
 * mayúsculas y eso en SQL sería otra regla que mantener aparte de la de la
 * aplicación.
 */

export interface PosibleDuplicado {
  id: string
  fecha_ingreso: string
  paciente_nombre: string | null
  doctor_nombre: string
  consultorio_nombre: string
  tipo_nombre: string
  precio_acordado: number
  estado: string
}

interface Args {
  doctorId: string
  pacienteNombre: string | null
  /** Ids del catálogo que lleva el trabajo nuevo. */
  tipos: readonly string[]
  fechaIngreso: string
  /** Al editar, el propio trabajo no cuenta como duplicado de sí mismo. */
  excluirId?: string
}

export async function buscarPosiblesDuplicados(a: Args): Promise<PosibleDuplicado[]> {
  // Sin paciente o sin tipos no se puede comprobar: son dos de las tres
  // validaciones. Se sale antes de consultar nada.
  if (!a.pacienteNombre?.trim() || a.tipos.length === 0) return []

  const supabase = await createServerSupabase()

  // El consultorio del doctor elegido: la validación es por consultorio, no por
  // doctor, porque el mismo paciente puede llegar por dos doctores del mismo
  // sitio y seguiría siendo el mismo trabajo.
  const { data: doc, error: errDoc } = await supabase
    .from('doctor')
    .select('consultorio_id')
    .eq('id', a.doctorId)
    .maybeSingle()
  if (errDoc || !doc) return []
  const consultorioId = (doc as { consultorio_id: string }).consultorio_id

  const { data, error } = await supabase
    .from('trabajo_listado')
    .select(
      'id, fecha_ingreso, paciente_nombre, doctor_nombre, consultorio_id, consultorio_nombre, precio_acordado, estado',
    )
    .eq('consultorio_id', consultorioId)
    .gte('fecha_ingreso', desdeQueFecha(a.fechaIngreso))
    .order('fecha_ingreso', { ascending: false })
  if (error) {
    // La vista puede no existir todavía. Sin ella no se avisa, pero el trabajo
    // se guarda: un filtro de calidad no puede impedir registrar producción.
    return []
  }

  type Fila = {
    id: string
    fecha_ingreso: string
    paciente_nombre: string | null
    doctor_nombre: string
    consultorio_id: string
    consultorio_nombre: string
    precio_acordado: number
    estado: string
  }
  const candidatos = ((data ?? []) as unknown as Fila[]).filter((f) => f.id !== a.excluirId)
  if (candidatos.length === 0) return []

  // Los tipos de cada candidato, en una sola consulta.
  const { data: items } = await supabase
    .from('trabajo_item')
    .select('trabajo_id, catalogo_trabajo_id, cantidad, orden, catalogo:catalogo_trabajo_id(nombre)')
    .in(
      'trabajo_id',
      candidatos.map((c) => c.id),
    )

  type Item = {
    trabajo_id: string
    catalogo_trabajo_id: string
    cantidad: number
    orden: number
    catalogo: { nombre: string } | { nombre: string }[] | null
  }
  const tiposPorTrabajo = new Map<string, string[]>()
  const nombresPorTrabajo = new Map<string, { cantidad: number; nombre: string; orden: number }[]>()
  for (const bruto of (items ?? []) as unknown as Item[]) {
    const lista = tiposPorTrabajo.get(bruto.trabajo_id) ?? []
    lista.push(bruto.catalogo_trabajo_id)
    tiposPorTrabajo.set(bruto.trabajo_id, lista)

    const cat = Array.isArray(bruto.catalogo) ? bruto.catalogo[0] : bruto.catalogo
    const nombres = nombresPorTrabajo.get(bruto.trabajo_id) ?? []
    nombres.push({ cantidad: bruto.cantidad, nombre: cat?.nombre ?? '—', orden: bruto.orden })
    nombresPorTrabajo.set(bruto.trabajo_id, nombres)
  }

  const nuevo: TrabajoComparable = {
    consultorio_id: consultorioId,
    paciente_nombre: a.pacienteNombre,
    tipos: a.tipos,
  }

  const { resumenItems } = await import('./resumen')

  return candidatos
    .filter((c) =>
      hayCoincidencia(nuevo, {
        consultorio_id: c.consultorio_id,
        paciente_nombre: c.paciente_nombre,
        tipos: tiposPorTrabajo.get(c.id) ?? [],
      }),
    )
    .map((c) => ({
      id: c.id,
      fecha_ingreso: c.fecha_ingreso,
      paciente_nombre: c.paciente_nombre,
      doctor_nombre: c.doctor_nombre,
      consultorio_nombre: c.consultorio_nombre,
      tipo_nombre: resumenItems(
        [...(nombresPorTrabajo.get(c.id) ?? [])]
          .sort((x, y) => x.orden - y.orden)
          .map((l) => ({ cantidad: l.cantidad, nombre: l.nombre })),
      ),
      precio_acordado: c.precio_acordado,
      estado: c.estado,
    }))
}
