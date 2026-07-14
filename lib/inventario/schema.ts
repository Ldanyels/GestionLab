import { z } from 'zod'
import { UNIDADES } from './types'

export const productoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  unidad: z.enum(UNIDADES).default('unidad'),
  stock_minimo: z.coerce.number().min(0).default(0),
  costo_unitario: z.coerce.number().min(0).default(0),
  stock_inicial: z.coerce.number().min(0).default(0),
})

const costoOpcional = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
  z.number().min(0, 'El costo no puede ser negativo').nullable(),
)

export const movimientoSchema = z.object({
  tipo: z.enum(['ingreso', 'salida', 'ajuste', 'merma']),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  // Para 'ajuste' el usuario elige si suma o resta.
  ajuste_resta: z.coerce.boolean().default(false),
  // Solo para ingresos: origen (compra/ajuste/otro) y costo unitario de la compra.
  origen: z.enum(['compra', 'ajuste', 'otro']).optional(),
  costo_unitario: costoOpcional,
  motivo: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null)),
  fecha: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
})

export type ProductoInput = z.infer<typeof productoSchema>
export type MovimientoInput = z.infer<typeof movimientoSchema>

/** Convierte la cantidad ingresada por el usuario en el delta con signo aplicado al stock. */
export function deltaMovimiento(input: MovimientoInput): number {
  switch (input.tipo) {
    case 'ingreso':
      return input.cantidad
    case 'salida':
    case 'merma':
      return -input.cantidad
    case 'ajuste':
      return input.ajuste_resta ? -input.cantidad : input.cantidad
  }
}
