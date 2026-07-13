import { z } from 'zod'
import { METODOS_PAGO } from './types'

export const abonoSchema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  metodo: z.enum(METODOS_PAGO).default('efectivo'),
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
})

export type AbonoInput = z.infer<typeof abonoSchema>
