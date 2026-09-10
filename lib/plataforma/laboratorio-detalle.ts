import { clienteDeLaboratorio } from './cliente'
import type { LaboratorioFila } from './laboratorios'
import type { EstadoTrabajo } from '@/lib/trabajos/estado'

/**
 * Columnas de un trabajo para el panel de plataforma.
 *
 * **`paciente_nombre` no está, y su ausencia es la función.** Quien opera la
 * plataforma no trata datos de salud: un trabajo se identifica por su tipo, su
 * doctor, su fecha y su monto, que alcanza para encontrarlo y corregirlo.
 */
export const COLUMNAS_TRABAJO =
  'id, fecha_ingreso, entregado_el, estado, precio_acordado, ' +
  'doctor:doctor_id(nombre, consultorio:consultorio_id(nombre)), ' +
  'catalogo:catalogo_trabajo_id(nombre), abonos:abono(monto)'

export interface TrabajoDePlataforma {
  id: string
  tipo_nombre: string
  doctor_nombre: string
  consultorio_nombre: string
  fecha_ingreso: string
  entregado_el: string | null
  estado: EstadoTrabajo
  precio_acordado: number
  saldo: number
}

export interface FilaCrudaDeTrabajo {
  id: string
  fecha_ingreso: string
  entregado_el: string | null
  estado: EstadoTrabajo
  precio_acordado: number
  doctor: { nombre: string; consultorio: { nombre: string } | null } | null
  catalogo: { nombre: string } | null
  abonos: { monto: number }[] | null
}

/** Construye el objeto campo por campo: nada de la fila cruda pasa sin querer. */
export function aTrabajoDePlataforma(fila: FilaCrudaDeTrabajo): TrabajoDePlataforma {
  const pagado = (fila.abonos ?? []).reduce((s, a) => s + a.monto, 0)
  return {
    id: fila.id,
    tipo_nombre: fila.catalogo?.nombre ?? '—',
    doctor_nombre: fila.doctor?.nombre ?? '—',
    consultorio_nombre: fila.doctor?.consultorio?.nombre ?? '—',
    fecha_ingreso: fila.fecha_ingreso,
    entregado_el: fila.entregado_el,
    estado: fila.estado,
    precio_acordado: fila.precio_acordado,
    saldo: Math.round((fila.precio_acordado - pagado) * 100) / 100,
  }
}

/** Cuánto le deben al laboratorio, sobre los trabajos ya traídos. */
export function porCobrarDe(trabajos: readonly TrabajoDePlataforma[]): number {
  return Math.round(trabajos.reduce((s, t) => s + t.saldo, 0) * 100) / 100
}

/** Cuándo entró el último trabajo: dice si el laboratorio sigue vivo. */
export function ultimoIngresoDe(trabajos: readonly TrabajoDePlataforma[]): string | null {
  return trabajos.reduce<string | null>(
    (max, t) => (max === null || t.fecha_ingreso > max ? t.fecha_ingreso : max),
    null,
  )
}

export async function trabajosDeLaboratorio(id: string): Promise<TrabajoDePlataforma[]> {
  const cliente = clienteDeLaboratorio(id)
  const { data, error } = await cliente
    .leer('trabajo', COLUMNAS_TRABAJO)
    .order('fecha_ingreso', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as FilaCrudaDeTrabajo[]).map(aTrabajoDePlataforma)
}

export interface ItemDeCatalogo {
  id: string
  categoria: string
  nombre: string
  precio_base: number
  activo: boolean
}

/** El catálogo de un laboratorio, ordenado como lo vería él. */
export async function catalogoDeLaboratorio(labId: string): Promise<ItemDeCatalogo[]> {
  const { data, error } = await clienteDeLaboratorio(labId)
    .leer('catalogo_trabajo', 'id, categoria, nombre, precio_base, activo')
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ItemDeCatalogo[]
}

export interface AbonoDePlataforma {
  id: string
  monto: number
  fecha: string | null
  metodo: string
}

export interface TrabajoConAbonos {
  trabajo: TrabajoDePlataforma
  abonos: AbonoDePlataforma[]
}

/**
 * Un trabajo concreto con sus abonos, para la pantalla de corrección.
 *
 * Devuelve `null` cuando ese trabajo no es de ese laboratorio: el cliente
 * acotado no lo encuentra, y eso es la barrera, no una comprobación aparte.
 */
export async function trabajoParaCorregir(
  labId: string,
  trabajoId: string,
): Promise<TrabajoConAbonos | null> {
  const cliente = clienteDeLaboratorio(labId)

  const { data, error } = await cliente
    .leer('trabajo', COLUMNAS_TRABAJO)
    .eq('id', trabajoId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const { data: abonos, error: errAbonos } = await cliente
    .leer('abono', 'id, monto, fecha, metodo')
    .eq('trabajo_id', trabajoId)
    .order('fecha', { ascending: false })
  if (errAbonos) throw new Error(errAbonos.message)

  return {
    trabajo: aTrabajoDePlataforma(data as unknown as FilaCrudaDeTrabajo),
    abonos: (abonos ?? []) as unknown as AbonoDePlataforma[],
  }
}

export interface ResumenDeLaboratorio {
  laboratorio: LaboratorioFila
  consultorios: number
  doctores: number
}

export async function resumenDeLaboratorio(id: string): Promise<ResumenDeLaboratorio | null> {
  const cliente = clienteDeLaboratorio(id)
  // Conteos incrustados: PostgREST devuelve `[{count: N}]` por cada relación.
  const { data, error } = await cliente
    .laboratorio(
      'id, nombre, plan, estado, creado_en, doc_tipo, doc_numero, razon_social, direccion_fiscal, perfil(count), trabajo(count), consultorio(count), doctor(count)',
    )
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const fila = data as unknown as {
    id: string
    nombre: string
    plan: LaboratorioFila['plan']
    estado: LaboratorioFila['estado']
    creado_en: string
    doc_tipo: string | null
    doc_numero: string | null
    razon_social: string | null
    direccion_fiscal: string | null
    perfil: { count: number }[] | null
    trabajo: { count: number }[] | null
    consultorio: { count: number }[] | null
    doctor: { count: number }[] | null
  }

  return {
    laboratorio: {
      id: fila.id,
      nombre: fila.nombre,
      plan: fila.plan,
      estado: fila.estado,
      creado_en: fila.creado_en,
      usuarios: fila.perfil?.[0]?.count ?? 0,
      trabajos: fila.trabajo?.[0]?.count ?? 0,
      doc_tipo: fila.doc_tipo,
      doc_numero: fila.doc_numero,
      razon_social: fila.razon_social,
      direccion_fiscal: fila.direccion_fiscal,
    },
    consultorios: fila.consultorio?.[0]?.count ?? 0,
    doctores: fila.doctor?.[0]?.count ?? 0,
  }
}
