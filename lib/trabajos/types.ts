import type { EstadoEtapa, EstadoTrabajo } from './estado'

export interface Trabajo {
  id: string
  laboratorio_id: string
  doctor_id: string
  catalogo_trabajo_id: string
  paciente_nombre: string | null
  fecha_ingreso: string
  fecha_entrega: string | null
  estado: EstadoTrabajo
  precio_acordado: number
  variable_cantidad: number
  notas: string | null
  creado_en: string
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
}
