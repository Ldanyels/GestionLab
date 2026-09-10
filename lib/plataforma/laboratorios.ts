import { z } from 'zod'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { ErrorParaElUsuario } from '@/lib/errores'
import { datosFacturacionSchema, TIPOS_DOC } from '@/lib/facturacion/documento'
import type { Periodicidad } from '@/lib/cuotas/periodos'
import type { Laboratorio } from '@/lib/supabase/types'

export const laboratorioNuevoSchema = z.object({
  laboratorio: z
    .string()
    .trim()
    .min(1, 'El nombre del laboratorio es obligatorio')
    .max(120),
  adminNombre: z
    .string()
    .trim()
    .min(1, 'El nombre del administrador es obligatorio')
    .max(120),
  adminEmail: z.string().trim().email('Correo inválido'),
  // No se recorta, igual que en el resto del sistema: un espacio es un
  // carácter válido de la contraseña.
  adminPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),

  /*
    Datos de facturación: opcionales en el alta.

    Un laboratorio puede arrancar en el mes de cortesía antes de que se le
    pidan sus datos fiscales, y exigirlos aquí obligaría a inventarlos o a
    posponer el alta. Se completan después desde el panel, que los muestra
    como pendientes mientras falten.

    Si se escribe el número, se valida el grupo completo: unos datos fiscales a
    medias no sirven para emitir nada.
  */
  facTipo: z.enum(TIPOS_DOC).optional(),
  facNumero: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .optional(),
  facRazonSocial: z.string().trim().max(200).optional(),
  facDireccion: z.string().trim().max(200).optional(),
}).superRefine((d, ctx) => {
  if (!d.facNumero) return
  const parsed = datosFacturacionSchema.safeParse({
    doc_tipo: d.facTipo ?? 'RUC',
    doc_numero: d.facNumero,
    razon_social: d.facRazonSocial ?? '',
    direccion_fiscal: d.facDireccion ?? '',
  })
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      ctx.addIssue({ code: 'custom', message: issue.message, path: ['facNumero'] })
    }
  }
})
export type LaboratorioNuevo = z.infer<typeof laboratorioNuevoSchema>

export interface LaboratorioFila extends Laboratorio {
  creado_en: string
  usuarios: number
  trabajos: number
  doc_tipo: string | null
  doc_numero: string | null
  razon_social: string | null
  direccion_fiscal: string | null
  periodicidad: Periodicidad | null
  precio_cuota: number | null
  inicio_cobro: string | null
}

/**
 * Todos los laboratorios de la plataforma, con cuántos usuarios y trabajos
 * tiene cada uno.
 *
 * Usa la clave de servicio porque necesita ver **todos** los inquilinos, que
 * es justo lo que las políticas RLS impiden. Y ahí está la decisión de fondo
 * del panel: el poder viene del servidor, no de relajar una política. Por eso
 * la suite de aislamiento sigue pasando sin modificarse.
 */
export async function listarLaboratorios(): Promise<LaboratorioFila[]> {
  const admin = createAdminSupabase()
  const { data, error } = await admin
    .from('laboratorio')
    .select('id, nombre, plan, estado, creado_en, doc_tipo, doc_numero, razon_social, direccion_fiscal, periodicidad, precio_cuota, inicio_cobro, perfil(count), trabajo(count)')
    .order('creado_en', { ascending: true })
  if (error) throw new Error(error.message)

  type Cruda = Omit<LaboratorioFila, 'usuarios' | 'trabajos'> & {
    perfil: { count: number }[] | null
    trabajo: { count: number }[] | null
  }

  return ((data ?? []) as unknown as Cruda[]).map((l) => ({
    id: l.id,
    nombre: l.nombre,
    plan: l.plan,
    estado: l.estado,
    creado_en: l.creado_en,
    usuarios: l.perfil?.[0]?.count ?? 0,
    trabajos: l.trabajo?.[0]?.count ?? 0,
    doc_tipo: l.doc_tipo,
    doc_numero: l.doc_numero,
    razon_social: l.razon_social,
    direccion_fiscal: l.direccion_fiscal,
    periodicidad: l.periodicidad,
    precio_cuota: l.precio_cuota,
    inicio_cobro: l.inicio_cobro,
  }))
}

/**
 * Crea un laboratorio con su administrador: tres cosas que deben quedar todas
 * o ninguna.
 *
 * **No es una transacción de base de datos.** Crear el usuario de
 * autenticación es una llamada a otro servicio y no participa del BEGIN/COMMIT
 * de PostgreSQL, así que la reversión es explícita en código. De ahí que el
 * orden importe: primero lo que se puede deshacer barato.
 *
 * Sustituye los tres pasos manuales de SQL que documentaba
 * `docs/supabase-setup.md`.
 */
export async function crearLaboratorioConAdmin(
  input: LaboratorioNuevo,
): Promise<{ laboratorioId: string }> {
  const admin = createAdminSupabase()

  const { data: lab, error: errLab } = await admin
    .from('laboratorio')
    .insert({
      nombre: input.laboratorio,
      // Si no vinieron, quedan en nulo y el panel los pide.
      doc_tipo: input.facNumero ? (input.facTipo ?? 'RUC') : null,
      doc_numero: input.facNumero || null,
      razon_social: input.facRazonSocial || null,
      direccion_fiscal: input.facDireccion || null,
    })
    .select('id')
    .single()
  if (errLab) throw new Error(errLab.message)
  const laboratorioId = (lab as { id: string }).id

  const { data: creado, error: errUsuario } = await admin.auth.admin.createUser({
    email: input.adminEmail,
    password: input.adminPassword,
    email_confirm: true,
  })
  if (errUsuario) {
    await admin.from('laboratorio').delete().eq('id', laboratorioId)
    // Los correos son únicos en todo el proyecto de Supabase, no por
    // laboratorio: hay que decir que ya tiene cuenta en otro sitio en vez de
    // dar un mensaje genérico que deja al operador sin saber qué pasó. Va
    // marcado para que el envoltorio de la acción no lo sustituya por el texto
    // de respaldo; el mensaje crudo de Supabase, en cambio, sí se traduce.
    if (errUsuario.message.includes('already')) {
      throw new ErrorParaElUsuario('Ese correo ya tiene una cuenta en la plataforma')
    }
    throw new Error(errUsuario.message)
  }
  const usuarioId = creado.user!.id

  const { error: errPerfil } = await admin.from('perfil').insert({
    id: usuarioId,
    laboratorio_id: laboratorioId,
    nombre: input.adminNombre,
    rol: 'admin',
  })
  if (errPerfil) {
    await admin.auth.admin.deleteUser(usuarioId)
    await admin.from('laboratorio').delete().eq('id', laboratorioId)
    throw new Error(errPerfil.message)
  }

  return { laboratorioId }
}

/**
 * Suspende o reactiva el acceso de un laboratorio.
 *
 * El efecto es inmediato y ya está construido: `app/(app)/layout.tsx` muestra
 * la pantalla de cuenta suspendida y las rutas de exportación devuelven 403.
 */
export async function cambiarEstadoLaboratorio(
  id: string,
  estado: Laboratorio['estado'],
): Promise<void> {
  const admin = createAdminSupabase()
  const { error } = await admin.from('laboratorio').update({ estado }).eq('id', id)
  if (error) throw new Error(error.message)
}
