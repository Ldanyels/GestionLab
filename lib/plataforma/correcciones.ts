import { clienteDeLaboratorio } from './cliente'
import { registrarCambioDePlataforma } from './auditoria'
import { formatMoney } from '@/lib/format'
import { ETIQUETA_TRABAJO, type EstadoTrabajo } from '@/lib/trabajos/estado'

/** Lo único que la plataforma puede corregir de un trabajo. */
export interface CamposDeTrabajo {
  precio_acordado: number
  estado: EstadoTrabajo
  fecha_ingreso: string
  entregado_el: string | null
}

export type CambiosDeTrabajo = Partial<CamposDeTrabajo>

/**
 * Quita de los cambios propuestos los que ya valen eso.
 *
 * Un formulario manda todos sus campos, incluidos los que nadie tocó. Sin este
 * filtro, cada guardado dejaría en el historial cambios que no ocurrieron, y un
 * historial que registra lo que no pasó es peor que no tener historial.
 */
export function cambiosEfectivos(
  antes: CamposDeTrabajo,
  propuestos: CambiosDeTrabajo,
): CambiosDeTrabajo {
  const efectivos: CambiosDeTrabajo = {}
  for (const clave of Object.keys(propuestos) as (keyof CamposDeTrabajo)[]) {
    if (propuestos[clave] !== antes[clave]) {
      // La aserción es segura: la clave viene de `propuestos` y su tipo por
      // clave es el mismo en las dos estructuras.
      Object.assign(efectivos, { [clave]: propuestos[clave] })
    }
  }
  return efectivos
}

const SIN_FECHA = 'sin registrar'

/**
 * Describe una corrección **con el valor anterior**, para el historial.
 *
 * El valor anterior es la mitad que importa: «cambió el precio» no le sirve de
 * nada a un laboratorio que quiere saber cuánto cobraba antes por ese trabajo.
 */
export function detalleDeCorreccion(
  antes: CamposDeTrabajo,
  cambios: CambiosDeTrabajo,
): string {
  const frases: string[] = []

  if (cambios.precio_acordado !== undefined) {
    frases.push(
      `cambió el precio de ${formatMoney(antes.precio_acordado)} a ${formatMoney(cambios.precio_acordado)}`,
    )
  }
  if (cambios.estado !== undefined) {
    frases.push(
      `cambió el estado de ${ETIQUETA_TRABAJO[antes.estado]} a ${ETIQUETA_TRABAJO[cambios.estado]}`,
    )
  }
  if (cambios.fecha_ingreso !== undefined) {
    frases.push(`cambió la fecha de ingreso de ${antes.fecha_ingreso} a ${cambios.fecha_ingreso}`)
  }
  if (cambios.entregado_el !== undefined) {
    frases.push(
      `cambió la fecha de entrega de ${antes.entregado_el ?? SIN_FECHA} a ${cambios.entregado_el ?? SIN_FECHA}`,
    )
  }

  return frases.join('; ')
}

export function detalleDeAbonoBorrado(abono: { monto: number; fecha: string | null }): string {
  const importe = `borró un abono de ${formatMoney(abono.monto)}`
  return abono.fecha ? `${importe} del ${abono.fecha}` : importe
}

/**
 * Corrige un trabajo de otro laboratorio, dejando rastro del antes y el después.
 *
 * Lee la fila primero por dos razones que se refuerzan: para poder registrar el
 * valor anterior, y porque leerla con el cliente acotado es lo que confirma que
 * ese trabajo es de ese laboratorio. Si no lo es, no aparece, y no se toca nada.
 *
 * Devuelve el detalle registrado, o cadena vacía si no había nada que cambiar.
 */
export async function corregirTrabajoDesdeLaPlataforma(
  labId: string,
  trabajoId: string,
  propuestos: CambiosDeTrabajo,
  correoOperador: string,
): Promise<string> {
  const cliente = clienteDeLaboratorio(labId)

  const { data, error } = await cliente
    .leer('trabajo', 'id, precio_acordado, estado, fecha_ingreso, entregado_el')
    .eq('id', trabajoId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return ''

  const antes = data as unknown as CamposDeTrabajo
  const cambios = cambiosEfectivos(antes, propuestos)
  if (Object.keys(cambios).length === 0) return ''

  const { error: errUpdate } = await cliente.escribir('trabajo', cambios).eq('id', trabajoId)
  if (errUpdate) throw new Error(errUpdate.message)

  const detalle = detalleDeCorreccion(antes, cambios)
  await registrarCambioDePlataforma(labId, correoOperador, {
    tabla: 'trabajo',
    registroId: trabajoId,
    accion: 'UPDATE',
    detalle,
  })
  return detalle
}

/**
 * Borra un abono mal registrado de otro laboratorio.
 *
 * Solo borra; no crea ni edita importes. Un pago que la plataforma inventara
 * sería peor que el error que viene a arreglar: quien sabe cuánto pagó de
 * verdad ese consultorio es el laboratorio, y volver a registrarlo le toca a
 * él. Aquí solo se deshace lo que está mal.
 */
export async function borrarAbonoDesdeLaPlataforma(
  labId: string,
  abonoId: string,
  correoOperador: string,
): Promise<boolean> {
  const cliente = clienteDeLaboratorio(labId)

  const { data, error } = await cliente
    .leer('abono', 'id, monto, fecha, trabajo_id')
    .eq('id', abonoId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return false

  const abono = data as unknown as {
    id: string
    monto: number
    fecha: string | null
    trabajo_id: string
  }

  const { error: errDelete } = await cliente.borrar('abono').eq('id', abonoId)
  if (errDelete) throw new Error(errDelete.message)

  await registrarCambioDePlataforma(labId, correoOperador, {
    // Se apunta contra el trabajo y no contra el abono: el abono ya no existe,
    // y quien revise el historial lo busca por el trabajo al que pertenecía.
    tabla: 'abono',
    registroId: abono.trabajo_id,
    accion: 'DELETE',
    detalle: detalleDeAbonoBorrado(abono),
  })
  return true
}
