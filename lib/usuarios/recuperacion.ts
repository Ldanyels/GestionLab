import { z } from 'zod'

/** Correo con el que se pide el enlace de recuperación. */
export const correoSchema = z.object({
  email: z.string().trim().email('Correo inválido'),
})

/**
 * Contraseña nueva y su confirmación.
 *
 * El mínimo de 6 caracteres es el mismo que usa `usuarioSchema` al crear un
 * usuario: si aquí fuera distinto, un administrador podría fijar una
 * contraseña que el propio usuario no podría volver a poner.
 *
 * La contraseña **no** se recorta, a diferencia del correo: un espacio al
 * principio o al final es un carácter válido, y quitarlo dejaría a la persona
 * sin poder entrar con lo que ella cree que escribió.
 */
export const claveNuevaSchema = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmacion: z.string(),
  })
  .refine((d) => d.password === d.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  })
