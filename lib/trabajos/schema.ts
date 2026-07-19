import { z } from 'zod'

const opcionalTexto = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? v : null))

const precioManualOpcional = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
  z.number().min(0, 'El precio no puede ser negativo').nullable(),
)

const fechaOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))

export const trabajoSchema = z.object({
  doctor_id: z.string().uuid('Selecciona un doctor'),
  catalogo_trabajo_id: z.string().uuid('Selecciona un tipo de trabajo'),
  paciente_nombre: opcionalTexto,
  pieza: opcionalTexto,
  variable_cantidad: z.coerce.number().int().min(0).default(0),
  precio_manual: precioManualOpcional,
  fecha_entrega: fechaOpcional,
  notas: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
})

export type TrabajoInput = z.infer<typeof trabajoSchema>
