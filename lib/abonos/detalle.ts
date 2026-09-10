import { formatMoney } from '@/lib/format'

/** Los campos de un abono que se pueden corregir. */
export interface CamposDeAbono {
  monto: number
  metodo: string
  fecha: string | null
  nota: string | null
}

const SIN_FECHA = 'sin fecha'
const SIN_NOTA = 'sin nota'

/**
 * Describe una edición **con el valor anterior**, para el historial.
 *
 * Un abono editable sin rastro del monto anterior es una forma silenciosa de
 * alterar cuentas: el saldo del trabajo se recalcula solo, así que cambiar un
 * monto cambia lo que un consultorio debe sin que quede constancia de cuánto
 * debía antes. El valor anterior es lo que permite reconstruirlo.
 */
export function detalleDeEdicion(antes: CamposDeAbono, despues: CamposDeAbono): string {
  const frases: string[] = []

  if (antes.monto !== despues.monto) {
    frases.push(
      `cambió el monto del abono de ${formatMoney(antes.monto)} a ${formatMoney(despues.monto)}`,
    )
  }
  if (antes.metodo !== despues.metodo) {
    frases.push(`cambió el método del abono de ${antes.metodo} a ${despues.metodo}`)
  }
  if (antes.fecha !== despues.fecha) {
    frases.push(
      `cambió la fecha del abono de ${antes.fecha ?? SIN_FECHA} a ${despues.fecha ?? SIN_FECHA}`,
    )
  }
  if (antes.nota !== despues.nota) {
    const texto = (v: string | null) => (v ? `«${v}»` : SIN_NOTA)
    frases.push(`cambió la nota del abono de ${texto(antes.nota)} a ${texto(despues.nota)}`)
  }

  return frases.join('; ')
}
