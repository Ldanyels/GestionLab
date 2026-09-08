import { describe, it, expect } from 'vitest'
import { agruparPorConsultorio, type FilaReporte } from './agrupar'

function fila(p: Partial<FilaReporte>): FilaReporte {
  return {
    id: 'x',
    fecha_ingreso: '2026-09-01',
    estado: 'en_curso',
    paciente: null,
    resumen: 'Corona',
    total: 0,
    pagado: 0,
    doctor_id: 'd1',
    doctor: 'Dr. A',
    consultorio_id: 'c1',
    consultorio: 'Clínica 1',
    ...p,
  }
}

describe('agruparPorConsultorio', () => {
  const filas = [
    fila({ id: 't1', total: 300, pagado: 100 }), // c1 / d1 -> debe 200
    fila({ id: 't2', total: 150, pagado: 150 }), // c1 / d1 -> debe 0
    fila({
      id: 't3',
      total: 500,
      pagado: 0,
      doctor_id: 'd2',
      doctor: 'Dr. B',
      consultorio_id: 'c2',
      consultorio: 'Clínica 2',
    }), // c2 / d2 -> debe 500
  ]

  it('calcula totales generales', () => {
    const { totales } = agruparPorConsultorio(filas)
    expect(totales).toEqual({ trabajos: 3, facturado: 950, pagado: 250, saldo: 700 })
  })

  it('agrupa por consultorio y doctor con subtotales', () => {
    const { grupos } = agruparPorConsultorio(filas)
    expect(grupos).toHaveLength(2)
    const c1 = grupos.find((g) => g.consultorio_id === 'c1')!
    expect(c1.facturado).toBe(450)
    expect(c1.saldo).toBe(200)
    expect(c1.doctores).toHaveLength(1)
    expect(c1.doctores[0].filas).toHaveLength(2)
  })

  it('ordena por saldo descendente (quién debe más primero)', () => {
    const { grupos } = agruparPorConsultorio(filas)
    expect(grupos[0].consultorio_id).toBe('c2')
  })

  it('sin filas devuelve vacío con totales en cero', () => {
    const { grupos, totales } = agruparPorConsultorio([])
    expect(grupos).toHaveLength(0)
    expect(totales.saldo).toBe(0)
  })
})
