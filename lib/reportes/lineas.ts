import { formatMoney } from '@/lib/format'
import type { LineaRecibo } from '@/lib/recibos/lineas'
import type { GrupoConsultorio, TotalesReporte } from './agrupar'

const SEP: LineaRecibo = { izq: '', separador: true }

/** Líneas del reporte en formato ticket 80mm (deuda por consultorio y doctor). */
export function lineasReporteTicket(args: {
  laboratorio: string
  fecha: string
  rango: string
  filtro?: string
  soloPendientes?: boolean
  /** false = sin importes (técnicos): solo conteo de trabajos. */
  montos?: boolean
  grupos: GrupoConsultorio[]
  totales: TotalesReporte
}): LineaRecibo[] {
  const montos = args.montos !== false
  const cuenta = (n: number) => `${n} trab.`
  const lineas: LineaRecibo[] = [
    { izq: args.laboratorio, centrada: true, bold: true },
    {
      izq: !montos
        ? 'Trabajos por consultorio'
        : args.soloPendientes
          ? 'Pendiente por cobrar'
          : 'Reporte de trabajos',
      centrada: true,
    },
    { izq: args.rango, centrada: true },
  ]
  if (args.filtro) lineas.push({ izq: args.filtro, centrada: true })
  lineas.push({ izq: args.fecha, centrada: true }, SEP)

  if (args.grupos.length === 0) {
    lineas.push({
      izq: args.soloPendientes
        ? 'Sin deuda pendiente en el rango'
        : 'Sin trabajos en el rango elegido',
      centrada: true,
    })
  }
  for (const g of args.grupos) {
    const totalGrupo = g.doctores.reduce((s, d) => s + d.filas.length, 0)
    lineas.push({
      izq: g.consultorio,
      der: montos ? formatMoney(g.saldo) : cuenta(totalGrupo),
      bold: true,
    })
    for (const d of g.doctores) {
      lineas.push({
        izq: `  ${d.doctor}${montos ? ` (${d.filas.length})` : ''}`,
        der: montos ? formatMoney(d.saldo) : cuenta(d.filas.length),
      })
    }
  }

  lineas.push(SEP, { izq: `Trabajos: ${args.totales.trabajos}` })
  if (montos) {
    lineas.push(
      { izq: 'Monto final', der: formatMoney(args.totales.facturado) },
      { izq: 'Pagado', der: formatMoney(args.totales.pagado) },
      { izq: 'Saldo por cobrar', der: formatMoney(args.totales.saldo), bold: true },
    )
  }
  return lineas
}
