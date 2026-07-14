export interface Producto {
  id: string
  laboratorio_id: string
  nombre: string
  unidad: string
  stock_actual: number
  stock_minimo: number
  costo_unitario: number
  activo: boolean
  creado_en: string
}

export type TipoMovimiento = 'ingreso' | 'salida' | 'ajuste' | 'merma'

export interface Movimiento {
  id: string
  laboratorio_id: string
  producto_id: string
  tipo: TipoMovimiento
  cantidad: number
  costo_unitario: number | null
  motivo: string | null
  trabajo_id: string | null
  fecha: string
  creado_en: string
}

export interface ProductoConMovimientos extends Producto {
  movimientos: Movimiento[]
}

export const UNIDADES = ['unidad', 'g', 'kg', 'ml', 'cm', 'par', 'juego'] as const

/** Origen de un ingreso de stock (para clasificar entradas). */
export const ORIGENES_INGRESO = ['compra', 'ajuste', 'otro'] as const
export type OrigenIngreso = (typeof ORIGENES_INGRESO)[number]

export const ETIQUETA_ORIGEN: Record<OrigenIngreso, string> = {
  compra: 'Compra',
  ajuste: 'Ajuste de stock',
  otro: 'Otro',
}

export const ETIQUETA_MOV: Record<TipoMovimiento, string> = {
  ingreso: 'Ingreso',
  salida: 'Salida',
  ajuste: 'Ajuste',
  merma: 'Merma',
}
