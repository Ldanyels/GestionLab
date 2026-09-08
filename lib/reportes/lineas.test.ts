import { describe, it, expect } from 'vitest'
import { lineasReporteTicket } from './lineas'
import { agruparPorConsultorio, type FilaReporte } from './agrupar'

function fila(p: Partial<FilaReporte>): FilaReporte {
  return {
    id: 't1',
    fecha_ingreso: '2026-09-01',
    estado: 'en_curso',
    paciente: null,
    resumen: 'Corona',
    total: 300,
    pagado: 100,
    doctor_id: 'd1',
    doctor: 'Dr. A',
    consultorio_id: 'c1',
    consultorio: 'Clínica 1',
    ...p,
  }
}

function ticket(args: Partial<Parameters<typeof lineasReporteTicket>[0]> = {}): string {
  const { grupos, totales } = agruparPorConsultorio(args.grupos ? [] : [fila({})])
  return lineasReporteTicket({
    laboratorio: 'MasterLab',
    fecha: '07/09/2026 10:30',
    rango: '01/09/2026 – 30/09/2026',
    grupos,
    totales,
    ...args,
  })
    .map((l) => `${l.izq}${l.der ? ` | ${l.der}` : ''}`)
    .join('\n')
}

describe('lineasReporteTicket', () => {
  it('titula como cobranza en modo solo pendientes', () => {
    expect(ticket({ soloPendientes: true })).toContain('Pendiente por cobrar')
  })

  it('titula como reporte general cuando incluye todo', () => {
    const t = ticket({ soloPendientes: false })
    expect(t).toContain('Reporte de trabajos')
    expect(t).not.toContain('Pendiente por cobrar')
  })

  it('lista consultorio, doctor y totales', () => {
    const t = ticket({ soloPendientes: true })
    expect(t).toContain('Clínica 1 | S/ 200.00')
    expect(t).toContain('Dr. A (1) | S/ 200.00')
    expect(t).toContain('Trabajos: 1')
    expect(t).toContain('Saldo por cobrar | S/ 200.00')
  })

  it('mensaje vacío según el modo', () => {
    const grupos: never[] = []
    const totales = { trabajos: 0, facturado: 0, pagado: 0, saldo: 0 }
    expect(ticket({ grupos, totales, soloPendientes: true })).toContain(
      'Sin deuda pendiente en el rango',
    )
    expect(ticket({ grupos, totales, soloPendientes: false })).toContain(
      'Sin trabajos en el rango elegido',
    )
  })

  it('incluye el filtro cuando se indica', () => {
    expect(ticket({ filtro: 'Dr. A' })).toContain('Dr. A')
  })
})
