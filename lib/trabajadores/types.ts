export interface Trabajador {
  id: string
  laboratorio_id: string
  nombre: string
  activo: boolean
  creado_en: string
}

export interface PagoTrabajador {
  id: string
  laboratorio_id: string
  trabajador_id: string
  monto: number
  fecha: string
  nota: string | null
  catalogo_trabajo_id: string | null
  creado_en: string
}

export interface MontoEstandarItem {
  id: string
  catalogo_trabajo_id: string
  monto: number
  tipo_nombre: string
}

export interface TrabajadorDetalle extends Trabajador {
  montos: MontoEstandarItem[]
  pagos: PagoTrabajador[]
  total_pagado: number
}
