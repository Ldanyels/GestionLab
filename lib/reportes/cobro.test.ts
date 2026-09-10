import { describe, it, expect } from 'vitest'
import { contarFilasPorCobro, filtrarFilasPorCobro } from './cobro'
import type { FilaReporte } from './agrupar'

function fila(p: Partial<FilaReporte> = {}): FilaReporte {
  return {
    id: 't1',
    fecha_ingreso: '2026-09-01',
    entregado_el: null,
    estado: 'en_curso',
    paciente: null,
    resumen: 'Corona porcelana',
    total: 300,
    pagado: 0,
    doctor_id: 'd1',
    doctor: 'Dr. Pérez',
    consultorio_id: 'c1',
    consultorio: 'Arte oral',
    ...p,
  }
}

const filas = [
  fila({ id: 'debe', total: 300, pagado: 100 }),
  fila({ id: 'pagado', total: 300, pagado: 300 }),
  // Residuo de redondeo, no deuda: cuenta como pagado.
  fila({ id: 'casi', total: 300, pagado: 299.9995 }),
]

describe('filtrarFilasPorCobro', () => {
  it('por cobrar deja solo las que tienen saldo real', () => {
    expect(filtrarFilasPorCobro(filas, 'por_cobrar').map((f) => f.id)).toEqual(['debe'])
  })

  it('pagados incluye el residuo de redondeo', () => {
    expect(filtrarFilasPorCobro(filas, 'pagados').map((f) => f.id)).toEqual([
      'pagado',
      'casi',
    ])
  })

  it('cualquiera no filtra', () => {
    expect(filtrarFilasPorCobro(filas, 'cualquiera')).toHaveLength(3)
  })

  it('no muta la lista original', () => {
    const copia = [...filas]
    filtrarFilasPorCobro(filas, 'pagados')
    expect(filas).toEqual(copia)
  })
})

describe('contarFilasPorCobro', () => {
  it('cuenta cada situación', () => {
    expect(contarFilasPorCobro(filas)).toEqual({
      cualquiera: 3,
      por_cobrar: 1,
      pagados: 2,
    })
  })
})
