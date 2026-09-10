import { describe, it, expect } from 'vitest'
import {
  enlaceReporte,
  etiquetaRango,
  queryFiltros,
  resolverFiltros,
} from './filtros'

describe('resolverFiltros', () => {
  it('usa el mes actual cuando no hay fechas', () => {
    const f = resolverFiltros({})
    expect(f.desde).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(f.hasta).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(f.desde <= f.hasta).toBe(true)
  })

  it('respeta fechas válidas', () => {
    const f = resolverFiltros({ desde: '2026-01-01', hasta: '2026-03-31' })
    expect(f.desde).toBe('2026-01-01')
    expect(f.hasta).toBe('2026-03-31')
  })

  it('ignora fechas con formato inválido', () => {
    const f = resolverFiltros({ desde: '01/01/2026' })
    expect(f.desde).not.toBe('01/01/2026')
  })

  it('convierte filtros vacíos en undefined', () => {
    const f = resolverFiltros({ consultorio: '', doctor: 'd1' })
    expect(f.consultorioId).toBeUndefined()
    expect(f.doctorId).toBe('d1')
  })
})

describe('resolverFiltros · modo', () => {
  it('por defecto muestra solo lo pendiente por cobrar', () => {
    expect(resolverFiltros({}).soloPendientes).toBe(true)
  })

  it('mostrar=todos incluye los trabajos ya pagados', () => {
    expect(resolverFiltros({ mostrar: 'todos' }).soloPendientes).toBe(false)
  })
})

describe('queryFiltros', () => {
  it('conserva rango y filtros, y omite el cobro en modo pendientes', () => {
    const q = queryFiltros(
      resolverFiltros({ desde: '2026-09-01', hasta: '2026-09-30', consultorio: 'c1' }),
    )
    expect(q).toContain('desde=2026-09-01')
    expect(q).toContain('consultorio=c1')
    expect(q).not.toContain('doctor=')
    expect(q).not.toContain('pago=')
  })

  it('incluye el cobro cuando no es solo pendientes', () => {
    const q = queryFiltros(resolverFiltros({ pago: 'cualquiera' }))
    expect(q).toContain('pago=cualquiera')
  })
})

describe('etiquetaRango', () => {
  it('formatea el rango en dd/mm/yyyy', () => {
    expect(etiquetaRango('2026-09-01', '2026-09-30')).toBe('01/09/2026 – 30/09/2026')
  })
})

describe('resolverFiltros · estado', () => {
  it('sin estado no acota por estado', () => {
    expect(resolverFiltros({}).estado).toBeUndefined()
  })

  it('acepta los tres estados del trabajo', () => {
    expect(resolverFiltros({ estado: 'entregado' }).estado).toBe('entregado')
    expect(resolverFiltros({ estado: 'en_curso' }).estado).toBe('en_curso')
    expect(resolverFiltros({ estado: 'cerrado' }).estado).toBe('cerrado')
  })

  it('descarta un estado inventado en vez de vaciar el reporte', () => {
    expect(resolverFiltros({ estado: 'archivado' }).estado).toBeUndefined()
  })
})

describe('resolverFiltros · campo de fecha', () => {
  // Es lo que permite preguntar «qué entregamos este mes». Sin esto, un
  // reporte de entregados seguiría acotado por la fecha de ingreso.
  it('sobre entregados acota por la fecha real de entrega', () => {
    expect(resolverFiltros({ estado: 'entregado' }).campoFecha).toBe('entregado_el')
  })

  it('en cualquier otro caso acota por la de ingreso', () => {
    expect(resolverFiltros({}).campoFecha).toBe('fecha_ingreso')
    expect(resolverFiltros({ estado: 'cerrado' }).campoFecha).toBe('fecha_ingreso')
  })
})

describe('resolverFiltros · cobro', () => {
  it('por defecto sigue mostrando solo lo pendiente', () => {
    expect(resolverFiltros({}).pago).toBe('por_cobrar')
  })

  it('ahora se puede pedir solo lo ya pagado', () => {
    expect(resolverFiltros({ pago: 'pagados' }).pago).toBe('pagados')
  })

  // Los enlaces ya emitidos (PDF, ticket, marcadores) llevan ?mostrar=todos.
  it('respeta los enlaces antiguos', () => {
    expect(resolverFiltros({ mostrar: 'todos' }).pago).toBe('cualquiera')
    expect(resolverFiltros({ mostrar: 'todos' }).soloPendientes).toBe(false)
  })
})

describe('resolverFiltros · periodo', () => {
  it('por defecto es el mes', () => {
    expect(resolverFiltros({}).periodo).toBe('mes')
  })

  // Compatibilidad: antes las fechas venían sueltas, sin periodo.
  it('unas fechas sin periodo se interpretan como rango a medida', () => {
    const f = resolverFiltros({ desde: '2026-01-01', hasta: '2026-03-31' })
    expect(f.periodo).toBe('rango')
    expect(f.desde).toBe('2026-01-01')
  })

  it('el periodo manda sobre las fechas', () => {
    expect(resolverFiltros({ periodo: 'hoy' }).desde).toBe(
      resolverFiltros({ periodo: 'hoy' }).hasta,
    )
  })
})

describe('queryFiltros · dimensiones nuevas', () => {
  it('lleva el estado y el periodo a las exportaciones', () => {
    const f = resolverFiltros({ estado: 'entregado', periodo: '7d' })
    const q = queryFiltros(f)
    expect(q).toContain('estado=entregado')
    expect(q).toContain('periodo=7d')
  })

  it('no ensucia la URL con los valores por omisión', () => {
    const q = queryFiltros(resolverFiltros({}))
    expect(q).not.toContain('estado=')
    expect(q).not.toContain('pago=')
  })
})

describe('enlaceReporte', () => {
  const base = resolverFiltros({})

  it('sin filtros apunta al reporte limpio', () => {
    expect(enlaceReporte(base)).toBe('/reportes')
  })

  it('cambia una dimensión conservando las demás', () => {
    const con = resolverFiltros({ consultorio: 'c1' })
    const url = enlaceReporte(con, { estado: 'entregado' })
    expect(url).toContain('consultorio=c1')
    expect(url).toContain('estado=entregado')
  })

  // Con un periodo relativo, unas fechas en la URL describirían otro momento
  // en cuanto pasara un día.
  it('las fechas solo viajan con el rango a medida', () => {
    expect(enlaceReporte(base, { periodo: '7d' })).not.toContain('desde=')
    expect(enlaceReporte(base, { periodo: 'rango' })).toContain('desde=')
  })

  it('quitar el estado lo saca de la URL', () => {
    const con = resolverFiltros({ estado: 'entregado' })
    expect(enlaceReporte(con, { estado: undefined })).not.toContain('estado=')
  })
})
