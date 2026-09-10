'use server'

import { revalidatePath } from 'next/cache'
import { requirePermiso } from '@/lib/auth'
import { intentar } from '@/lib/acciones'
import {
  registrarCobroAgrupado,
  trabajosCobrablesDeConsultorio,
} from '@/lib/abonos/data'
import { validarCobro, type LineaDeCobro } from '@/lib/abonos/cobro'
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
  const saldoDe = new Map(cobrables.map((t) => [t.trabajo_id, t.saldo]))

  const lineas: LineaDeCobro[] = []
  for (const e of enviadas) {
    const id = String(e.trabajo_id ?? '')
    const saldo = saldoDe.get(id)
    // Un trabajo que ya no tiene saldo —o que no es de este consultorio— se
    // rechaza entero en vez de ignorarse: si el pago se calculó contando con
    // él, registrar el resto daría un importe que el laboratorio no aprobó.
    if (saldo === undefined) {
      return {
        error: 'Alguno de los trabajos cambió mientras registrabas el pago. Vuelve a cargar.',
      }
    }
    lineas.push({ trabajo_id: id, saldo, monto: Number(e.monto) })
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

  revalidatePath(`/consultorios/${consultorioId}`)
  revalidatePath(`/consultorios/${consultorioId}/cobrar`)
  revalidatePath('/consultorios/cuentas')
  revalidatePath('/trabajos')
  revalidatePath('/hoy')
  return { error: '' }
}
