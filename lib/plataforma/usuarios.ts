import {
  crearUsuarioEnLaboratorio,
  restablecerClaveEnLaboratorio,
  usuariosDeLaboratorio,
  type UsuarioInput,
  type UsuarioItem,
} from '@/lib/usuarios/data'
import { registrarCambioDePlataforma } from './auditoria'

export type { UsuarioItem } from '@/lib/usuarios/data'

/** Los usuarios de un laboratorio, para la ficha del panel. */
export async function usuariosParaElPanel(labId: string): Promise<UsuarioItem[]> {
  return usuariosDeLaboratorio(labId)
}

/**
 * Restablece la contraseña de un usuario de otro laboratorio, dejando rastro.
 *
 * El registro va **después** del cambio y solo si el cambio ocurrió: apuntar
 * uno que no pasó ensuciaría el historial del laboratorio con algo falso. Y si
 * el registro falla, la excepción sube: preferimos que el operador vea un error
 * y reintente a que la contraseña cambie sin constancia de quién lo hizo.
 *
 * Devuelve `false` cuando ese usuario no pertenece al laboratorio. No se
 * distingue de «no existe» a propósito.
 */
export async function restablecerClaveDesdeLaPlataforma(
  labId: string,
  usuarioId: string,
  password: string,
  correoOperador: string,
  nombreUsuario: string,
): Promise<boolean> {
  const hecho = await restablecerClaveEnLaboratorio(labId, usuarioId, password)
  if (!hecho) return false

  await registrarCambioDePlataforma(labId, correoOperador, {
    tabla: 'perfil',
    registroId: usuarioId,
    accion: 'UPDATE',
    detalle: `restableció la contraseña de ${nombreUsuario}`,
  })
  return true
}

/** Crea un usuario en otro laboratorio, dejando rastro. */
export async function crearUsuarioDesdeLaPlataforma(
  labId: string,
  input: UsuarioInput,
  correoOperador: string,
): Promise<void> {
  const usuarioId = await crearUsuarioEnLaboratorio(labId, input)

  await registrarCambioDePlataforma(labId, correoOperador, {
    tabla: 'perfil',
    registroId: usuarioId,
    accion: 'INSERT',
    detalle: `creó el usuario ${input.nombre} (${input.rol})`,
  })
}
