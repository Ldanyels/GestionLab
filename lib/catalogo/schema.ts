import { z } from 'zod'

const opcionalTexto = z
  .string()
  .trim()
  .max(60)
  .optional()
  .transform((v) => (v ? v : null))

const precioVariableOpcional = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
  z.number().min(0, 'El precio no puede ser negativo').nullable(),
)

export const catalogoSchema = z
  .object({
    categoria: z.string().trim().min(1, 'La categoría es obligatoria').max(80),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
    precio_base: z.coerce.number().min(0, 'El precio no puede ser negativo'),
    variable_etiqueta: opcionalTexto,
    variable_precio_unitario: precioVariableOpcional,
  })
  .refine(
    (d) =>
      (d.variable_etiqueta === null && d.variable_precio_unitario === null) ||
      (d.variable_etiqueta !== null && d.variable_precio_unitario !== null),
    {
      message:
        'El componente variable necesita etiqueta y precio unitario, o ninguno de los dos',
      path: ['variable_precio_unitario'],
    },
  )

export const etapaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre de la etapa es obligatorio').max(80),
})

export type CatalogoInput = z.infer<typeof catalogoSchema>
export type EtapaInput = z.infer<typeof etapaSchema>
