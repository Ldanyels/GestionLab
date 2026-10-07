'use server'

import { revalidatePath } from 'next/cache'
import { requirePermiso } from '@/lib/auth'
import { intentar, intentarSinEstado } from '@/lib/acciones'
import {
  registrarCobroAgrupado,
  trabajosCobrablesDeConsultorio,
} from '@/lib/abonos/data'
import {
  trabajosQueSeCierran,
  validarCobro,
  type LineaDeCobro,
  type LineaLiquidable,
} from '@/lib/abonos/cobro'
import { cambiarEstadoTrabajo } from '@/lib/trabajos/data'
import { descontarInsumosPorTrabajo } from '@/lib/inventario/data'
import { hoyLima } from '@/lib/trabajos/agenda'
import type { FormState } from '@/app/(app)/trabajos/actions'

/**
 * Registra un pago de un consultorio repartido entre sus trabajos.
 *
 * Los saldos se vuelven a leer **de la base**, no se aceptan los que manda el
 * formulario. Entre que la pantalla se cargó y se envió, alguien pudo registrar
 * otro abono sobre el mismo trabajo; con los saldos del cliente se cobraría dos
 * veces lo mismo. Y una Server Action se puede invocar directamente con
 * cualquier importe.
 */
export async function registrarCobroAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePermiso('abonos_registrar')

  const consultorioId = String(formData.get('consultorio_id') ?? '')
  if (!consultorioId) return { error: 'Falta el consultorio' }

  let enviadas: { trabajo_id?: unknown; monto?: unknown }[]
  try {
    const bruto = JSON.parse(String(formData.get('lineas') ?? '[]'))
    enviadas = Array.isArray(bruto) ? bruto : []
  } catch {
    return { error: 'No se entendió el reparto del pago' }
  }

  const cobrables = await trabajosCobrablesDeConsultorio(consultorioId)
  const porId = new Map(cobrables.map((t) => [t.trabajo_id, t]))

  const lineas: LineaDeCobro[] = []
  const liquidables: LineaLiquidable[] = []
  for (const e of enviadas) {
    const id = String(e.trabajo_id ?? '')
    const saldo = porId.get(id)?.saldo
    // Un trabajo que ya no tiene saldo —o que no es de este consultorio— se
    // rechaza entero en vez de ignorarse: si el pago se calculó contando con
    // él, registrar el resto daría un importe que el laboratorio no aprobó.
    if (saldo === undefined) {
      return {
        error: 'Alguno de los trabajos cambió mientras registrabas el pago. Vuelve a cargar.',
      }
    }
    const monto = Number(e.monto)
    lineas.push({ trabajo_id: id, saldo, monto })
    liquidables.push({
      trabajo_id: id,
      saldo,
      monto,
      estado: porId.get(id)?.estado ?? '',
    })
  }

  const validacion = validarCobro(lineas)
  if (!validacion.ok) return { error: validacion.error }

  const fecha = String(formData.get('fecha') ?? '').trim()
  const nota = String(formData.get('nota') ?? '').trim()

  const r = await intentar('registrarCobroAction', 'No se pudo registrar el pago', () =>
    registrarCobroAgrupado(
      lineas.map((l) => ({ trabajo_id: l.trabajo_id, monto: l.monto })),
      {
        metodo: String(formData.get('metodo') ?? 'efectivo'),
        fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null,
        nota: nota === '' ? null : nota,
      },
    ),
  )
  if (!r.ok) return r.estado

  /*
    Cobrado del todo, el trabajo se cierra solo.

    Cobrar es el último paso de un trabajo entregado: hasta ahora había que
    entrar a cada ficha a cerrarlo a mano, y en el piloto quedaban 22 pagados
    sin cerrar. Se cierra **después** de que el pago esté guardado: si se
    cerraran antes y el pago fallara, quedarían trabajos cerrados sin cobrar,
    que es el estado en el que nadie vuelve a mirarlos.

    Un fallo al cerrar no tumba la respuesta. El dinero ya está registrado, que
    es lo que no se puede perder; un trabajo sin cerrar se arregla desde su
    ficha, y `intentarSinEstado` deja el error anotado.
  */
  const cerrados = trabajosQueSeCierran(liquidables)
  const hoy = hoyLima()
  for (const id of cerrados) {
    await intentarSinEstado(
      'registrarCobroAction/cerrar',
      'No se pudo cerrar el trabajo',
      async () => {
        await cambiarEstadoTrabajo(id, 'cerrado', hoy)
        await descontarInsumosPorTrabajo(id)
      },
    )
    revalidatePath(`/trabajos/${id}`)
  }
  // Cerrar descuenta los insumos del trabajo; si no se cerró ninguno, el
  // inventario no cambió.
  if (cerrados.length > 0) revalidatePath('/inventario')

  revalidatePath(`/consultorios/${consultorioId}`)
  revalidatePath(`/consultorios/${consultorioId}/cobrar`)
  revalidatePath('/consultorios/cuentas')
  revalidatePath('/trabajos')
  revalidatePath('/hoy')
  return { error: '' }
}
