import { formatMoney } from '@/lib/format'

export interface ReciboDatos {
  laboratorio: string
  fecha: string
  doctor: string
  consultorio: string
  paciente: string | null
  pieza: string | null
  tipo: string
  cantidad: number
  precioTotal: number
  abonos: { fecha: string; metodo: string; monto: number }[]
}

export interface LineaRecibo {
  izq: string
  der?: string
  bold?: boolean
  centrada?: boolean
  separador?: boolean
}

const SEP: LineaRecibo = { izq: '', separador: true }

// Caracteres fuera de Latin-1 que WinAnsi (fuentes estándar de PDF) sí soporta.
const EXTRA_WINANSI = new Set(['…', '€', '“', '”', '‘', '’', '–', '—', '•', '™', 'œ', 'Œ', 'š', 'Š', 'ž', 'Ž', 'ƒ', '†', '‡', '‰', '‹', '›', '˜', 'ˆ', '‚', '„'])

/**
 * Sanea texto libre para las fuentes estándar de PDF (WinAnsi):
 * caracteres no representables (emoji, CJK, etc.) se reemplazan por '?'.
 */
export function textoSeguro(s: string): string {
  return [...s]
    .map((ch) => {
      const cp = ch.codePointAt(0) ?? 0
      if (cp < 0x20) return ' '
      if (cp <= 0xff || EXTRA_WINANSI.has(ch)) return ch
      return '?'
    })
    .join('')
}

/** dd/mm/yyyy desde una fecha ISO (yyyy-mm-dd). */
export function fechaCorta(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

/** Total ya pagado y saldo pendiente de un recibo. */
export function totalesRecibo(d: Pick<ReciboDatos, 'precioTotal' | 'abonos'>): {
  pagado: number
  saldo: number
} {
  const pagado = d.abonos.reduce((s, a) => s + a.monto, 0)
  return {
    pagado: Math.round(pagado * 100) / 100,
    saldo: Math.round((d.precioTotal - pagado) * 100) / 100,
  }
}

/** Líneas del recibo (ticket 80mm), compartidas por la vista impresa y el PDF. */
export function lineasRecibo(d: ReciboDatos): LineaRecibo[] {
  const { pagado, saldo } = totalesRecibo(d)
  const lineas: LineaRecibo[] = [
    { izq: d.laboratorio, centrada: true, bold: true },
    { izq: 'Recibo de venta', centrada: true },
    { izq: d.fecha, centrada: true },
    SEP,
    { izq: 'Doctor', der: d.doctor },
    { izq: 'Consultorio', der: d.consultorio },
  ]
  if (d.paciente) lineas.push({ izq: 'Paciente', der: d.paciente })
  if (d.pieza) lineas.push({ izq: 'Pieza', der: d.pieza })
  lineas.push(SEP, {
    izq: `${d.cantidad > 1 ? `${d.cantidad} × ` : ''}${d.tipo}`,
    der: formatMoney(d.precioTotal),
    bold: true,
  })
  if (d.abonos.length > 0) {
    lineas.push(SEP, { izq: 'Abonos', bold: true })
    for (const a of d.abonos) {
      lineas.push({
        izq: `${fechaCorta(a.fecha)} · ${a.metodo}`,
        der: formatMoney(a.monto),
      })
    }
  }
  lineas.push(
    SEP,
    { izq: 'Total', der: formatMoney(d.precioTotal) },
    { izq: 'Pagado', der: formatMoney(pagado) },
    { izq: 'Saldo', der: formatMoney(saldo), bold: true },
    SEP,
    { izq: '¡Gracias por su preferencia!', centrada: true },
  )
  return lineas
}
