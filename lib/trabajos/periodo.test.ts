import { describe, it, expect } from 'vitest'
import {
  campoFechaDe,
  ETIQUETA_CAMPO_FECHA,
  ETIQUETA_PERIODO,
  filtrarPorFecha,
  PERIODOS,
  rangoDePeriodo,
  resolverPeriodo,
  fechaValida,
  restarDias,
} from './periodo'

const HOY = '2026-09-08'

describe('restarDias', () => {
  it('resta dentro del mismo mes', () => {
    expect(restarDias('2026-09-08', 6)).toBe('2026-09-02')
  })

  it('cruza el inicio de mes', () => {
    expect(restarDias('2026-09-08', 30)).toBe('2026-08-09')
  })

  it('cruza el inicio de año', () => {
    expect(restarDias('2026-01-03', 5)).toBe('2025-12-29')
  })

  it('respeta los años bisiestos', () => {
    expect(restarDias('2028-03-01', 1)).toBe('2028-02-29')
  })

  it('restar cero devuelve el mismo día', () => {
    expect(restarDias(HOY, 0)).toBe(HOY)
  })

  // Aritmética en UTC a propósito: usar la zona local del servidor haría que el
  // resultado cambiara según dónde corra la función.
  it('rellena mes y día con dos dígitos', () => {
    expect(restarDias('2026-10-05', 4)).toBe('2026-10-01')
  })
})

describe('resolverPeriodo', () => {
  it('acepta los periodos conocidos', () => {
    for (const p of PERIODOS) expect(resolverPeriodo(p)).toBe(p)
  })

  it('cualquier otra cosa cae en "todo"', () => {
    expect(resolverPeriodo(undefined)).toBe('todo')
    expect(resolverPeriodo('')).toBe('todo')
    expect(resolverPeriodo('ayer')).toBe('todo')
    expect(resolverPeriodo('DROP TABLE')).toBe('todo')
  })
})

describe('rangoDePeriodo', () => {
  it('"todo" no acota nada', () => {
    expect(rangoDePeriodo('todo', HOY)).toBeNull()
  })

  it('"hoy" es un solo día', () => {
    expect(rangoDePeriodo('hoy', HOY)).toEqual({ desde: HOY, hasta: HOY })
  })

  it('"7d" incluye hoy y los seis anteriores', () => {
    expect(rangoDePeriodo('7d', HOY)).toEqual({ desde: '2026-09-02', hasta: HOY })
  })

  it('"30d" incluye hoy y los veintinueve anteriores', () => {
    expect(rangoDePeriodo('30d', HOY)).toEqual({ desde: '2026-08-10', hasta: HOY })
  })

  it('"rango" usa las fechas que se le pasan', () => {
    expect(rangoDePeriodo('rango', HOY, '2026-09-01', '2026-09-05')).toEqual({
      desde: '2026-09-01',
      hasta: '2026-09-05',
    })
  })

  it('"rango" sin fechas no acota: no deja la lista vacía por accidente', () => {
    expect(rangoDePeriodo('rango', HOY)).toBeNull()
  })

  it('"rango" con solo una fecha acota por ese extremo', () => {
    expect(rangoDePeriodo('rango', HOY, '2026-09-05')).toEqual({
      desde: '2026-09-05',
      hasta: '9999-12-31',
    })
    expect(rangoDePeriodo('rango', HOY, undefined, '2026-09-05')).toEqual({
      desde: '0000-01-01',
      hasta: '2026-09-05',
    })
  })

  it('"rango" al revés se endereza en vez de devolver nada', () => {
    expect(rangoDePeriodo('rango', HOY, '2026-09-30', '2026-09-01')).toEqual({
      desde: '2026-09-01',
      hasta: '2026-09-30',
    })
  })
})

describe('filtrarPorFecha', () => {
  const lista = [
    { id: 'a', fecha_ingreso: '2026-09-08' },
    { id: 'b', fecha_ingreso: '2026-09-07' },
    { id: 'c', fecha_ingreso: '2026-08-15' },
  ]

  it('sin rango devuelve todo', () => {
    expect(filtrarPorFecha(lista, null).map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('filtra por fecha de ingreso, con los extremos incluidos', () => {
    expect(
      filtrarPorFecha(lista, { desde: '2026-09-07', hasta: '2026-09-08' }).map((t) => t.id),
    ).toEqual(['a', 'b'])
  })

  it('un solo día deja solo ese día', () => {
    expect(
      filtrarPorFecha(lista, { desde: '2026-09-07', hasta: '2026-09-07' }).map((t) => t.id),
    ).toEqual(['b'])
  })

  it('un rango sin coincidencias devuelve lista vacía', () => {
    expect(filtrarPorFecha(lista, { desde: '2020-01-01', hasta: '2020-12-31' })).toEqual([])
  })

  it('no muta la lista original', () => {
    const copia = [...lista]
    filtrarPorFecha(lista, { desde: HOY, hasta: HOY })
    expect(lista).toEqual(copia)
  })
})

describe('campoFechaDe', () => {
  // Viendo entregados, «7 días» tiene que significar entregados esta semana.
  it('sobre entregados filtra por la fecha real de entrega', () => {
    expect(campoFechaDe('entregado')).toBe('entregado_el')
  })

  it('sobre cualquier otro estado filtra por la de ingreso', () => {
    expect(campoFechaDe('en_curso')).toBe('fecha_ingreso')
    expect(campoFechaDe('cerrado')).toBe('fecha_ingreso')
    expect(campoFechaDe(null)).toBe('fecha_ingreso')
  })
})

describe('ETIQUETA_CAMPO_FECHA', () => {
  it('nombra los dos campos para poder rotularlos en la barra', () => {
    expect(ETIQUETA_CAMPO_FECHA.fecha_ingreso).toBe('Ingreso')
    expect(ETIQUETA_CAMPO_FECHA.entregado_el).toBe('Entrega')
  })
})

describe('filtrarPorFecha sobre la fecha de entrega', () => {
  const entregados = [
    { id: 'a', fecha_ingreso: '2026-08-01', entregado_el: '2026-09-08' },
    { id: 'b', fecha_ingreso: '2026-09-08', entregado_el: '2026-08-20' },
    // Entregado sin fecha: son los trabajos anteriores a la migración.
    { id: 'c', fecha_ingreso: '2026-09-08', entregado_el: null },
  ]

  it('usa el campo que se le pide, no el de ingreso', () => {
    expect(
      filtrarPorFecha(entregados, { desde: '2026-09-01', hasta: '2026-09-30' }, 'entregado_el')
        .map((t) => t.id),
    ).toEqual(['a'])
  })

  // Sin esto, los entregados antiguos aparecerían en cualquier periodo o en
  // ninguno según cómo compare undefined, que es peor que dejarlos fuera.
  it('deja fuera los que no tienen fecha en ese campo', () => {
    expect(
      filtrarPorFecha(entregados, { desde: '2020-01-01', hasta: '2030-12-31' }, 'entregado_el')
        .map((t) => t.id),
    ).toEqual(['a', 'b'])
  })

  it('sin rango los devuelve todos, incluidos los sin fecha', () => {
    expect(filtrarPorFecha(entregados, null, 'entregado_el').map((t) => t.id)).toEqual([
      'a',
      'b',
      'c',
    ])
  })
})

describe('ETIQUETA_PERIODO', () => {
  it('tiene etiqueta para cada periodo', () => {
    for (const p of PERIODOS) expect(ETIQUETA_PERIODO[p]).toBeTruthy()
  })
})

describe('fechaValida — la puerta que cierra la inyección', () => {
  /*
    `desde` y `hasta` llegan de la URL y acaban construyendo, como texto, una
    expresión de filtro que se manda a la base. Se comprobó contra el proyecto
    real que un valor con paréntesis y comas altera esa expresión y PostgREST
    **acepta** la consulta manipulada. Esta función es el único sitio por el
    que pasan todas las pantallas con rango, así que es donde se corta.
  */
  it('acepta una fecha normal', () => {
    expect(fechaValida('2026-09-11')).toBe('2026-09-11')
  })

  it('rechaza la carga de inyección que se probó contra la base', () => {
    expect(fechaValida('2026-01-01),estado.eq.cerrado,and(fecha_ingreso.gte.2000-01-01')).toBeNull()
  })

  it('rechaza cualquier puntuación de la sintaxis de filtros', () => {
    expect(fechaValida('2026-01-01,x')).toBeNull()
    expect(fechaValida('2026-01-01)')).toBeNull()
    expect(fechaValida('(2026-01-01')).toBeNull()
    expect(fechaValida('2026-01-01.eq.x')).toBeNull()
    expect(fechaValida('*')).toBeNull()
  })

  it('rechaza lo vacío y lo ausente', () => {
    expect(fechaValida('')).toBeNull()
    expect(fechaValida(undefined)).toBeNull()
    expect(fechaValida(null)).toBeNull()
  })

  it('rechaza otros formatos de fecha', () => {
    expect(fechaValida('11/09/2026')).toBeNull()
    expect(fechaValida('2026-9-1')).toBeNull()
    expect(fechaValida('2026-09-11T10:00:00Z')).toBeNull()
  })

  /*
    Una fecha con la forma correcta que no existe en el calendario se descarta
    en vez de corregirse: si el sistema la moviera al 3 de marzo, devolvería
    resultados de un periodo que nadie pidió.
  */
  it('rechaza fechas que no existen', () => {
    expect(fechaValida('2026-02-31')).toBeNull()
    expect(fechaValida('2026-13-01')).toBeNull()
    expect(fechaValida('2026-00-10')).toBeNull()
  })

  it('acepta el 29 de febrero de un año bisiesto', () => {
    expect(fechaValida('2028-02-29')).toBe('2028-02-29')
    expect(fechaValida('2026-02-29')).toBeNull()
  })
})

describe('rangoDePeriodo — con fechas manipuladas', () => {
  /*
    Lo que importa: una fecha inválida no llega al filtro. Se comporta como si
    no se hubiera indicado, que es lo que el usuario ve de todos modos.
  */
  it('una fecha inyectada se ignora, no se propaga', () => {
    const r = rangoDePeriodo('rango', '2026-09-11', '2026-01-01),estado.eq.cerrado', undefined)
    expect(r).toBeNull()
  })

  it('con una válida y una inyectada, solo sobrevive la válida', () => {
    const r = rangoDePeriodo('rango', '2026-09-11', '2026-01-01', 'x),y.eq.z')
    expect(r).toEqual({ desde: '2026-01-01', hasta: '9999-12-31' })
  })

  it('las fechas válidas siguen funcionando igual que antes', () => {
    expect(rangoDePeriodo('rango', '2026-09-11', '2026-01-01', '2026-03-31')).toEqual({
      desde: '2026-01-01',
      hasta: '2026-03-31',
    })
  })
})
