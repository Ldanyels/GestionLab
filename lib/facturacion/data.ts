import { createAdminSupabase } from '@/lib/supabase/admin'
import { registrarCambioDePlataforma } from '@/lib/plataforma/auditoria'
import type { DatosFacturacion } from './documento'

/**
 * Guarda los datos de facturación de un laboratorio desde el panel.
 *
 * Deja rastro como cualquier otro cambio del panel: son datos del cliente y
 * quien los corrige está tocando la información con la que se le cobra.
 */
export async function guardarFacturacion(
  laboratorioId: string,
  datos: DatosFacturacion,
  correoOperador: string,
): Promise<void> {
  const admin = createAdminSupabase()
  const { error } = await admin
    .from('laboratorio')
    .update({
      doc_tipo: datos.doc_tipo,
      doc_numero: datos.doc_numero,
      razon_social: datos.razon_social,
      direccion_fiscal: datos.direccion_fiscal,
    })
    .eq('id', laboratorioId)
  if (error) throw new Error(error.message)

  await registrarCambioDePlataforma(laboratorioId, correoOperador, {
    tabla: 'laboratorio',
    registroId: laboratorioId,
    accion: 'UPDATE',
    detalle: `actualizó los datos de facturación: ${datos.razon_social}, ${datos.doc_tipo} ${datos.doc_numero}`,
  })
}
