import { z } from 'zod'
import { CATEGORIAS_GASTO } from './categorias'

export const gastoSchema = z.object({
  categoria: z.enum(CATEGORIAS_GASTO),
  concepto: z
    .string()
    .trim()
    .min(1, 'Escribe en qué fue el gasto')
    .max(120, 'El concepto es demasiado largo'),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  fecha: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha no es válida'),
})

export type GastoInput = z.infer<typeof gastoSchema>
