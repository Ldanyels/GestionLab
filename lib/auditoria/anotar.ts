import { createAdminSupabase } from '@/lib/supabase/admin'
import { registrarError } from '@/lib/registro'

/**
 * Añade el «qué se hizo» al registro que el disparador acaba de escribir.
 *
 * Los disparadores de la migración 0010 apuntan tabla, registro, acción y
 * usuario, pero no los valores. Para el dinero eso no alcanza: «actualizó un
 * abono» no permite saber si el monto subió o bajó.
 *
 * Va por la clave de servicio porque la política de `auditoria` solo permite
 * **leer** al usuario del laboratorio; las filas las escribe el disparador con
 * permisos elevados. El `laboratorio_id` se recibe del servidor, nunca del
 * cliente.
 *
 * Completa la fila existente en vez de añadir otra, para que el historial no
 * muestre dos entradas por un solo cambio. Si no la encuentra —por ejemplo si
 * el disparador no llegó a correr— inserta una, que es mejor que perder el
 * rastro.
 *
 * Nunca interrumpe: el cambio ya se guardó, y fallar aquí no debe deshacerlo ni
 * mostrarle un error a quien corrigió bien su abono.
 */
export async function anotarDetalle(opciones: {
  laboratorioId: string
  tabla: string
  registroId: string
  accion: 'INSERT' | 'UPDATE' | 'DELETE'
  detalle: string
  usuarioId: string | null
  usuarioNombre: string | null
}): Promise<void> {
  const { laboratorioId, tabla, registroId, accion, detalle } = opciones
  if (!detalle) return

  try {
    const admin = createAdminSupabase()

    const { data: reciente } = await admin
      .from('auditoria')
      .select('id')
      .eq('laboratorio_id', laboratorioId)
      .eq('tabla', tabla)
      .eq('registro_id', registroId)
      .eq('accion', accion)
      .is('detalle', null)
      .order('creado_en', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (reciente) {
      const { error } = await admin
        .from('auditoria')
        .update({ detalle })
        .eq('id', (reciente as { id: number }).id)
      if (error) throw new Error(error.message)
      return
    }

    const { error } = await admin.from('auditoria').insert({
      laboratorio_id: laboratorioId,
      tabla,
      registro_id: registroId,
      accion,
      detalle,
      usuario_id: opciones.usuarioId,
      usuario_nombre: opciones.usuarioNombre,
    })
    if (error) throw new Error(error.message)
  } catch (e) {
    registrarError('anotarDetalle', e, 'no se pudo anotar el detalle del cambio')
  }
}
