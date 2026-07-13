import { z } from 'zod'

export const trabajadorSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
})

export const pagoTrabajadorSchema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  fecha: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  nota: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null)),
  catalogo_trabajo_id: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
})

export const montoEstandarSchema = z.object({
  catalogo_trabajo_id: z.string().uuid('Selecciona un tipo de trabajo'),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
})

export type TrabajadorInput = z.infer<typeof trabajadorSchema>
export type PagoTrabajadorInput = z.infer<typeof pagoTrabajadorSchema>
export type MontoEstandarInput = z.infer<typeof montoEstandarSchema>
