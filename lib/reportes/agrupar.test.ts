import { describe, it, expect } from 'vitest'
import {
  agruparPorConsultorio,
  porFechaDeEntrega,
  soloConSaldo,
  saldoFila,
  type FilaReporte,
} from './agrupar'

function fila(p: Partial<FilaReporte>): FilaReporte {
  return {
    id: 'x',
    fecha_ingreso: '2026-09-01',
    entregado_el: null,
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

describe('agruparPorConsultorio', () => {
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

describe('soloConSaldo', () => {
  it('deja fuera los trabajos totalmente pagados', () => {
    const r = soloConSaldo(filas)
    expect(r.map((f) => f.id)).toEqual(['t1', 't3'])
  })

  it('el reporte de cobranza solo suma lo pendiente', () => {
    const { totales } = agruparPorConsultorio(soloConSaldo(filas))
    expect(totales.trabajos).toBe(2)
    expect(totales.saldo).toBe(700)
    expect(totales.facturado).toBe(800) // 300 + 500, sin el trabajo pagado
  })

  it('sin deudas devuelve lista vacía', () => {
    expect(soloConSaldo([fila({ total: 100, pagado: 100 })])).toHaveLength(0)
  })
})

describe('saldoFila', () => {
  it('redondea a dos decimales', () => {
    expect(saldoFila({ total: 100.005, pagado: 0 })).toBe(100.01)
  })
})

describe('porFechaDeEntrega', () => {
  const f = (id: string, entregado_el: string | null, fecha_ingreso = '2026-09-01'): FilaReporte => ({
    id,
    fecha_ingreso,
    entregado_el,
    estado: 'entregado',
    paciente: null,
    resumen: 'Corona',
    total: 100,
    pagado: 0,
    doctor_id: 'd1',
    doctor: 'Dra. Ruiz',
    consultorio_id: 'c1',
    consultorio: 'Sonrisa',
  })

  const ordenar = (filas: FilaReporte[]) => [...filas].sort(porFechaDeEntrega).map((x) => x.id)

  it('de la entrega más antigua a la más reciente', () => {
    expect(
      ordenar([f('c', '2026-09-20'), f('a', '2026-09-05'), f('b', '2026-09-12')]),
    ).toEqual(['a', 'b', 'c'])
  })

  /*
    Los que no han salido no tienen fecha que mostrar. Intercalarlos por su
    ingreso dejaría filas con «—» en medio de una columna de fechas ordenada,
    que se lee como un fallo de la exportación.
  */
  it('los que no han salido van al final', () => {
    expect(ordenar([f('sin', null), f('con', '2026-09-20')])).toEqual(['con', 'sin'])
  })

  it('entre los que no han salido, manda su ingreso', () => {
    expect(
      ordenar([f('b', null, '2026-09-10'), f('a', null, '2026-09-02')]),
    ).toEqual(['a', 'b'])
  })

  it('a igual entrega, desempata el ingreso', () => {
    expect(
      ordenar([
        f('b', '2026-09-20', '2026-09-15'),
        f('a', '2026-09-20', '2026-09-03'),
      ]),
    ).toEqual(['a', 'b'])
  })

  it('cruzando el año, ordena por año y no por día', () => {
    expect(ordenar([f('b', '2027-01-05'), f('a', '2026-12-28')])).toEqual(['a', 'b'])
  })
})

describe('agruparPorConsultorio — orden de las filas', () => {
  const f = (id: string, entregado_el: string | null): FilaReporte => ({
    id,
    fecha_ingreso: '2026-09-01',
    entregado_el,
    estado: 'entregado',
    paciente: null,
    resumen: 'Corona',
    total: 100,
    pagado: 0,
    doctor_id: 'd1',
    doctor: 'Dra. Ruiz',
    consultorio_id: 'c1',
    consultorio: 'Sonrisa',
  })

  it('dentro de un doctor, los trabajos salen por fecha', () => {
    const { grupos } = agruparPorConsultorio([
      f('tarde', '2026-09-20'),
      f('sin', null),
      f('pronto', '2026-09-05'),
    ])
    expect(grupos[0]!.doctores[0]!.filas.map((x) => x.id)).toEqual(['pronto', 'tarde', 'sin'])
  })
})
