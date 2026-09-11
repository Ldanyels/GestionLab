import { describe, it, expect } from 'vitest'
import {
  ESTADOS_ACTIVIDAD,
  diasSinActividad,
  estadoDeActividad,
  resumenDelNegocio,
  tendencia,
  type MetricaDeLaboratorio,
} from './metricas'

function metrica(p: Partial<MetricaDeLaboratorio> = {}): MetricaDeLaboratorio {
  return {
    laboratorio_id: 'l1',
    nombre: 'Lab',
    plan: 'pagado',
    estado: 'activo',
    precio_cuota: 250,
    periodicidad: 'mensual',
    trabajos_7: 10,
    trabajos_previos_7: 10,
    trabajos_mes: 40,
    trabajos_total: 500,
    ultimo_trabajo: '2026-09-11',
    fotos: 0,
    accesos_soporte: 0,
    errores: 0,
    ...p,
  }
}

describe('tendencia', () => {
  it('calcula la variación entre las dos semanas', () => {
    expect(tendencia(15, 10)).toEqual({ pct: 50, direccion: 'sube' })
    expect(tendencia(5, 10)).toEqual({ pct: -50, direccion: 'baja' })
    expect(tendencia(10, 10)).toEqual({ pct: 0, direccion: 'igual' })
  })

  /*
    Sin semana anterior no hay variación que calcular: dividir entre cero daría
    «Infinity%». Un laboratorio que empieza es «nuevo», no uno que creció
    infinito.
  */
  it('sin semana anterior, es nuevo y no infinito', () => {
    expect(tendencia(12, 0)).toEqual({ pct: 0, direccion: 'nuevo' })
  })

  /*
    Caer a cero teniendo actividad antes es el caso que más importa: es un
    laboratorio que dejó de usar el sistema, y hay que verlo como caída total y
    no como «sin datos».
  */
  it('caer a cero es una caída del 100%', () => {
    expect(tendencia(0, 20)).toEqual({ pct: -100, direccion: 'baja' })
  })

  it('sin actividad en ninguna de las dos semanas, no hay tendencia', () => {
    expect(tendencia(0, 0)).toEqual({ pct: 0, direccion: 'igual' })
  })

  it('redondea a entero', () => {
    expect(tendencia(7, 3).pct).toBe(133)
  })
})

describe('diasSinActividad', () => {
  it('cuenta desde el último trabajo', () => {
    expect(diasSinActividad('2026-09-04', '2026-09-11')).toBe(7)
  })

  it('con un trabajo hoy son cero días', () => {
    expect(diasSinActividad('2026-09-11', '2026-09-11')).toBe(0)
  })

  /*
    Un laboratorio sin ningún trabajo nunca. No es «cero días sin actividad»,
    que lo haría parecer sano: es el que más atención necesita, porque le diste
    de alta y no arrancó.
  */
  it('sin ningún trabajo devuelve null', () => {
    expect(diasSinActividad(null, '2026-09-11')).toBeNull()
  })
})

describe('estadoDeActividad', () => {
  it('los estados posibles están declarados', () => {
    expect(ESTADOS_ACTIVIDAD).toEqual(['sin_arrancar', 'dormido', 'bajando', 'activo'])
  })

  it('con trabajo reciente y estable, está activo', () => {
    expect(estadoDeActividad(metrica({ trabajos_7: 30, trabajos_previos_7: 28 }), '2026-09-11')).toBe('activo')
  })

  /*
    Una caída fuerte de una semana a otra es el aviso temprano de fuga: llega
    semanas antes que la cuota impagada, cuando todavía se puede llamar.
  */
  it('una caída fuerte lo marca como bajando', () => {
    expect(estadoDeActividad(metrica({ trabajos_7: 4, trabajos_previos_7: 20 }), '2026-09-11')).toBe('bajando')
  })

  it('una caída leve no alarma', () => {
    expect(estadoDeActividad(metrica({ trabajos_7: 18, trabajos_previos_7: 20 }), '2026-09-11')).toBe('activo')
  })

  it('sin trabajos en dos semanas, está dormido', () => {
    expect(
      estadoDeActividad(
        metrica({ trabajos_7: 0, trabajos_previos_7: 0, ultimo_trabajo: '2026-08-01' }),
        '2026-09-11',
      ),
    ).toBe('dormido')
  })

  it('el que nunca registró nada no arrancó', () => {
    expect(
      estadoDeActividad(
        metrica({ trabajos_7: 0, trabajos_previos_7: 0, trabajos_total: 0, ultimo_trabajo: null }),
        '2026-09-11',
      ),
    ).toBe('sin_arrancar')
  })

  /*
    Un laboratorio en cortesía que no usa el sistema no es una alarma
    comercial: no hay ingreso que perder. Se distingue igual, pero es el estado
    el que informa, no el plan.
  */
  it('un laboratorio recién creado sin trabajos no cuenta como caída', () => {
    expect(
      estadoDeActividad(metrica({ trabajos_7: 0, trabajos_previos_7: 0, trabajos_total: 0, ultimo_trabajo: null }), '2026-09-11'),
    ).not.toBe('bajando')
  })
})

describe('resumenDelNegocio', () => {
  it('suma el ingreso comprometido de los que pagan', () => {
    const r = resumenDelNegocio(
      [
        metrica({ plan: 'pagado', precio_cuota: 250 }),
        metrica({ laboratorio_id: 'l2', plan: 'pagado', precio_cuota: 350 }),
      ],
      '2026-09-11',
    )
    expect(r.ingresoMensual).toBe(600)
  })

  /*
    Los de cortesía no suman ingreso. Contarlos inflaría la cifra con dinero
    que nadie va a pagar, que es la peor forma de mirar un negocio.
  */
  it('los de cortesía no suman ingreso', () => {
    const r = resumenDelNegocio(
      [metrica({ plan: 'gratis', precio_cuota: 250 }), metrica({ laboratorio_id: 'l2', plan: 'pagado', precio_cuota: 250 })],
      '2026-09-11',
    )
    expect(r.ingresoMensual).toBe(250)
    expect(r.deCortesia).toBe(1)
    expect(r.dePago).toBe(1)
  })

  /*
    Un plan anual se reparte entre doce para poder sumarlo con los mensuales:
    sin eso, un cliente de S/2.500 al año aparecería como S/2.500 al mes.
  */
  it('el plan anual se prorratea al mes', () => {
    const r = resumenDelNegocio(
      [metrica({ plan: 'pagado', precio_cuota: 2400, periodicidad: 'anual' })],
      '2026-09-11',
    )
    expect(r.ingresoMensual).toBe(200)
  })

  it('un laboratorio suspendido no cuenta como ingreso', () => {
    const r = resumenDelNegocio(
      [metrica({ plan: 'pagado', precio_cuota: 250, estado: 'suspendido' })],
      '2026-09-11',
    )
    expect(r.ingresoMensual).toBe(0)
    expect(r.suspendidos).toBe(1)
  })

  it('suma los trabajos del mes de todos', () => {
    const r = resumenDelNegocio(
      [metrica({ trabajos_mes: 500 }), metrica({ laboratorio_id: 'l2', trabajos_mes: 120 })],
      '2026-09-11',
    )
    expect(r.trabajosDelMes).toBe(620)
  })

  it('cuenta los que necesitan atención', () => {
    const r = resumenDelNegocio(
      [
        metrica({ trabajos_7: 30, trabajos_previos_7: 28 }),
        metrica({ laboratorio_id: 'l2', trabajos_7: 2, trabajos_previos_7: 25 }),
        metrica({ laboratorio_id: 'l3', trabajos_7: 0, trabajos_previos_7: 0, ultimo_trabajo: '2026-07-01' }),
      ],
      '2026-09-11',
    )
    expect(r.necesitanAtencion).toBe(2)
  })

  it('sin laboratorios, todo en cero', () => {
    const r = resumenDelNegocio([], '2026-09-11')
    expect(r).toEqual({
      total: 0,
      dePago: 0,
      deCortesia: 0,
      suspendidos: 0,
      ingresoMensual: 0,
      trabajosDelMes: 0,
      necesitanAtencion: 0,
    })
  })
})
