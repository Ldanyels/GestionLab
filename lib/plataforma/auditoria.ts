import { createAdminSupabase } from '@/lib/supabase/admin'
import { registrarError } from '@/lib/registro'

/**
 * Una visita de la plataforma a un laboratorio, tal como se guarda.
 *
 * Los campos de usuario van en nulo a propósito: la visita no la hizo ningún
 * usuario del laboratorio, y rellenarlos falsearía su historial.
 */
export interface FilaDeAcceso {
  laboratorio_id: string
  tabla: 'laboratorio'
  registro_id: string
  accion: 'ACCESO'
  usuario_id: null
  usuario_nombre: null
  actor_plataforma: string
}

export function filaDeAcceso(laboratorioId: string, correo: string): FilaDeAcceso {
  return {
    laboratorio_id: laboratorioId,
    tabla: 'laboratorio',
    registro_id: laboratorioId,
    accion: 'ACCESO',
    usuario_id: null,
    usuario_nombre: null,
    actor_plataforma: correo.trim().toLowerCase(),
  }
}

/**
 * Deja constancia de que la plataforma abrió este laboratorio.
 *
 * No interrumpe nunca: si el registro falla, se anota en el servidor y la ficha
 * se muestra igual. Dejar a un operador sin poder atender a un cliente porque
 * no se pudo apuntar la visita sería un mal cambio; el registro es una
 * obligación de la plataforma, no una condición del servicio.
 */
export async function registrarAccesoDePlataforma(
  laboratorioId: string,
  correo: string,
): Promise<void> {
  try {
    const admin = createAdminSupabase()
    const { error } = await admin.from('auditoria').insert(filaDeAcceso(laboratorioId, correo))
    if (error) throw new Error(error.message)
  } catch (e) {
    registrarError('registrarAccesoDePlataforma', e, 'no se pudo registrar el acceso')
  }
}
