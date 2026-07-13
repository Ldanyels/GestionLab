export interface Abono {
  id: string
  laboratorio_id: string
  trabajo_id: string
  monto: number
  fecha: string
  metodo: string
  nota: string | null
  creado_en: string
}

export const METODOS_PAGO = [
  'efectivo',
  'transferencia',
  'yape/plin',
  'tarjeta',
  'otro',
] as const
