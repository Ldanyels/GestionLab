import { z } from 'zod'

/**
 * Datos para emitir el comprobante a un laboratorio.
 *
 * Se admiten tres documentos porque los clientes no son homogéneos: un
 * laboratorio constituido tiene RUC, un técnico dental independiente puede
 * recibir boleta con su DNI, y hay profesionales extranjeros con carné de
 * extranjería. Exigir RUC habría dejado fuera a parte de la clientela.
 */
export const TIPOS_DOC = ['RUC', 'DNI', 'CE'] as const
export type TipoDoc = (typeof TIPOS_DOC)[number]

export const ETIQUETA_DOC: Record<TipoDoc, string> = {
  RUC: 'RUC',
  DNI: 'DNI',
  CE: 'Carné de extranjería',
}

/** Reglas de cada documento, con su mensaje. */
const REGLA: Record<TipoDoc, { patron: RegExp; error: string }> = {
  RUC: { patron: /^\d{11}$/, error: 'El RUC son 11 dígitos' },
  DNI: { patron: /^\d{8}$/, error: 'El DNI son 8 dígitos' },
  // El carné no tiene longitud única y puede llevar letras.
  CE: { patron: /^[A-Za-z0-9]{8,12}$/, error: 'El carné de extranjería son 8 a 12 caracteres' },
}

const opcional = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? v : null))

export const datosFacturacionSchema = z
  .object({
    doc_tipo: z.enum(TIPOS_DOC),
    // Se quitan guiones y espacios: la gente los escribe y no forman parte del
    // número.
    doc_numero: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, '')),
    razon_social: z
      .string()
      .trim()
      .min(1, 'El nombre o razón social es obligatorio')
      .max(200),
    direccion_fiscal: opcional,
  })
  .superRefine((d, ctx) => {
    const regla = REGLA[d.doc_tipo]
    if (!regla.patron.test(d.doc_numero)) {
      ctx.addIssue({ code: 'custom', message: regla.error, path: ['doc_numero'] })
    }
  })

export type DatosFacturacion = z.infer<typeof datosFacturacionSchema>

/** Lo que puede venir de la base: cualquiera de los campos puede faltar. */
export interface FacturacionGuardada {
  doc_tipo?: TipoDoc | string | null
  doc_numero?: string | null
  razon_social?: string | null
  direccion_fiscal?: string | null
}

/** ¿Se puede emitir un comprobante con lo que hay guardado? */
export function tieneDatosFacturacion(f: FacturacionGuardada): boolean {
  return Boolean(f.doc_tipo && f.doc_numero && f.razon_social)
}

/**
 * Una línea para identificar fiscalmente al laboratorio.
 *
 * Dice que faltan datos en vez de pintar media línea: los laboratorios dados de
 * alta antes de que existieran estos campos no los tienen, y una línea a medias
 * parece un error del sistema en vez de un dato pendiente.
 */
export function descripcionFiscal(f: FacturacionGuardada): string {
  if (!tieneDatosFacturacion(f)) return 'Sin datos de facturación'
  const tipo = ETIQUETA_DOC[f.doc_tipo as TipoDoc] ?? f.doc_tipo
  return `${f.razon_social} · ${tipo} ${f.doc_numero}`
}
