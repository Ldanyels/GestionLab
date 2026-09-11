import type { MomentoFoto } from './reglas'

/**
 * Tipos y constantes de las fotos que **también usa el navegador**.
 *
 * Viven fuera de `data.ts` porque ese módulo importa `next/headers` a través
 * del cliente de servidor de Supabase, y eso lo arrastraría al paquete del
 * navegador: la compilación falla con «You're importing a module that depends
 * on next/headers». Es el mismo motivo por el que `rangoMesActual` salió de
 * `lib/finanzas/data.ts`.
 */

/** Bucket privado donde viven las fotos. */
export const BUCKET = 'trabajos'

export interface FotoDeTrabajo {
  id: string
  trabajo_id: string
  momento: MomentoFoto
  orden: number
  ruta: string
  creado_en: string
}

export interface FotoConEnlace extends FotoDeTrabajo {
  /** Enlace firmado y temporal. `null` si no se pudo firmar. */
  url: string | null
}
