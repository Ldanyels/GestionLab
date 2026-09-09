import type { EstadoEtapa, EstadoTrabajo } from './estado'

export interface Trabajo {
  id: string
  laboratorio_id: string
  doctor_id: string
  catalogo_trabajo_id: string
  paciente_nombre: string | null
  pieza: string | null
  fecha_ingreso: string
  /** Fecha **prometida** de entrega. La escribe quien crea el trabajo. */
  fecha_entrega: string | null
  /**
   * Fecha **real** de entrega. La sella el paso a `entregado` y el
   * administrador puede corregirla. NULL mientras no esté entregado, y también
   * en los entregados antes de la migración 0019.
   */
  entregado_el: string | null
  estado: EstadoTrabajo
  precio_acordado: number
  cantidad: number
  variable_cantidad: number
  notas: string | null
  creado_en: string
}

/** Línea de la cuenta: un tipo del catálogo con su cantidad y subtotal. */
export interface TrabajoItem {
  id: string
  laboratorio_id: string
  trabajo_id: string
  catalogo_trabajo_id: string
  cantidad: number
  variable_cantidad: number
  precio_unitario: number
  subtotal: number
  pieza: string | null
  orden: number
  creado_en: string
}

export interface TrabajoItemDetalle extends TrabajoItem {
  tipo_nombre: string
  variable_etiqueta: string | null
}

export interface TrabajoEtapa {
  id: string
  laboratorio_id: string
  trabajo_id: string
  nombre: string
  orden: number
  estado: EstadoEtapa
  motivo_exclusion: string | null
  fecha_cierre: string | null
  creado_en: string
}

/** Fila para listados: trabajo + nombres de doctor/consultorio/tipo + pago. */
export interface TrabajoListItem extends Trabajo {
  doctor_nombre: string
  consultorio_nombre: string
  tipo_nombre: string
  total_pagado: number
  saldo: number
}

export interface TrabajoDetalle extends TrabajoListItem {
  variable_etiqueta: string | null
  etapas: TrabajoEtapa[]
  items: TrabajoItemDetalle[]
}
