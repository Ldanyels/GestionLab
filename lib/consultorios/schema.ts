import { z } from 'zod'

const textoOpcional = z
  .string()
  .trim()
  .max(200, 'Máximo 200 caracteres')
  .optional()
  .transform((v) => (v ? v : null))

export const consultorioSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  contacto: textoOpcional,
  notas: z
    .string()
    .trim()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .transform((v) => (v ? v : null)),
})

export const doctorSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  contacto: textoOpcional,
})

export type ConsultorioInput = z.infer<typeof consultorioSchema>
export type DoctorInput = z.infer<typeof doctorSchema>
