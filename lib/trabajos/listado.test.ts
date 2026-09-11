import { describe, it, expect } from 'vitest'
import {
  aplicarFiltros,
  normalizarBusqueda,
  POR_PAGINA,
  rangoDePagina,
  totalDePaginas,
  type Filtrable,
  type FiltrosDeListado,
} from './listado'

/**
 * Una consulta de mentira que solo anota lo que le piden.
 *
 * No hace falta red ni simulacros de Supabase: lo que hay que comprobar es
 * **qué filtros se aplican**, y eso se ve en la lista de llamadas. Si algún día
 * se pierde un filtro, la lista mostraría trabajos de otro periodo o de otro
 * estado, y eso lo detecta esta prueba y no un tipo de TypeScript.
 */
function espia() {
  const llamadas: string[] = []
  const q: Filtrable = {
    eq: (c, v) => (llamadas.push(`eq:${c}=${v}`), q),
    gt: (c, v) => (llamadas.push(`gt:${c}=${v}`), q),
    gte: (c, v) => (llamadas.push(`gte:${c}=${v}`), q),
    lte: (c, v) => (llamadas.push(`lte:${c}=${v}`), q),
    like: (c, p) => (llamadas.push(`like:${c}=${p}`), q),
    or: (f) => (llamadas.push(`or:${f}`), q),
  }
  return { q, llamadas }
}

function filtros(p: Partial<FiltrosDeListado> = {}): FiltrosDeListado {
  return { estado: null, pago: 'cualquiera', rango: null, q: '', ...p }
}

describe('aplicarFiltros — estado', () => {
  it('sin estado no filtra por estado', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros())
    expect(llamadas).toEqual([])
  })

  it('filtra por el estado pedido', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros({ estado: 'en_curso' }))
    expect(llamadas).toEqual(['eq:estado=en_curso'])
  })
})

describe('aplicarFiltros — periodo', () => {
  const rango = { desde: '2026-09-01', hasta: '2026-09-30' }

  it('sin estado, el periodo acota por la fecha de ingreso', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros({ rango }))
    expect(llamadas).toEqual(['gte:fecha_ingreso=2026-09-01', 'lte:fecha_ingreso=2026-09-30'])
  })

  /*
    Los entregados se acotan por su fecha **real** de salida, no por la de
    ingreso. Si se usara la misma fecha para todos, el número de la pastilla
    prometería resultados que al pulsarla no aparecen.
  */
  it('en entregados, el periodo acota por la fecha de salida', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros({ estado: 'entregado', rango }))
    expect(llamadas[0]).toBe('eq:estado=entregado')
    expect(llamadas[1]).toContain('entregado_el')
  })

  /*
    Y los entregados **sin** fecha real siguen contando: son los anteriores a
    la migración 0019. Excluirlos ya hizo que al filtrar «entregados» salieran
    4 de 16, y el laboratorio pensó que se habían perdido trabajos.
  */
  it('los entregados sin fecha de salida no desaparecen', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros({ estado: 'entregado', rango }))
    expect(llamadas[1]).toContain('entregado_el.is.null')
  })
})

describe('aplicarFiltros — cobro', () => {
  it('«cualquiera» no filtra por saldo', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros({ pago: 'cualquiera' }))
    expect(llamadas).toEqual([])
  })

  it('«por cobrar» exige saldo por encima del umbral', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros({ pago: 'por_cobrar' }))
    expect(llamadas).toEqual(['gt:saldo=0.001'])
  })

  /*
    Un milésimo de sol: por debajo es residuo de redondeo, no deuda. Es el mismo
    umbral que usa `tieneSaldo` en memoria, y tienen que coincidir o la lista y
    el estado de cuenta discreparían sobre si un trabajo está cobrado.
  */
  it('«pagados» es lo que queda por debajo del mismo umbral', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros({ pago: 'pagados' }))
    expect(llamadas).toEqual(['lte:saldo=0.001'])
  })
})

describe('aplicarFiltros — búsqueda', () => {
  it('sin texto no busca', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros({ q: '   ' }))
    expect(llamadas).toEqual([])
  })

  it('busca la palabra en el campo de búsqueda', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros({ q: 'corona' }))
    expect(llamadas).toEqual(['like:busqueda=%corona%'])
  })

  /*
    Todas las palabras, no alguna: «arte ruiz» busca a la doctora Ruiz de Arte
    oral. Con «o» devolvería todo lo de Arte oral más todo lo de cualquier Ruiz.
  */
  it('exige todas las palabras', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros({ q: 'arte ruiz' }))
    expect(llamadas).toEqual(['like:busqueda=%arte%', 'like:busqueda=%ruiz%'])
  })

  /*
    La normalización tiene que ser la misma que aplica la vista al construir la
    columna. Si una quitara tildes y la otra no, buscar «Muñoz» no encontraría
    nada porque la columna guarda «munoz».
  */
  it('quita tildes y mayúsculas, como la vista', () => {
    expect(normalizarBusqueda('  MUÑOZ  ')).toBe('munoz')
    expect(normalizarBusqueda('Visión')).toBe('vision')
  })

  /*
    Las comas y los paréntesis son sintaxis de PostgREST: una búsqueda de
    «Pérez, Juan» rompería la consulta con un error incomprensible en vez de
    devolver resultados.
  */
  it('no deja que la puntuación rompa la consulta', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(q, filtros({ q: 'perez, (juan)' }))
    expect(llamadas.join(' ')).not.toContain(',')
    expect(llamadas.join(' ')).not.toContain('(')
  })
})

describe('aplicarFiltros — combinados', () => {
  it('aplica todos a la vez', () => {
    const { q, llamadas } = espia()
    aplicarFiltros(
      q,
      filtros({
        estado: 'en_curso',
        pago: 'por_cobrar',
        rango: { desde: '2026-09-01', hasta: '2026-09-30' },
        q: 'corona',
      }),
    )
    expect(llamadas).toEqual([
      'eq:estado=en_curso',
      'gte:fecha_ingreso=2026-09-01',
      'lte:fecha_ingreso=2026-09-30',
      'gt:saldo=0.001',
      'like:busqueda=%corona%',
    ])
  })
})

describe('paginación', () => {
  it('la primera página empieza en cero', () => {
    expect(rangoDePagina(1, 30)).toEqual([0, 29])
  })

  it('la segunda continúa donde acabó la primera', () => {
    expect(rangoDePagina(2, 30)).toEqual([30, 59])
  })

  /*
    Una URL escrita a mano puede traer `?pagina=0` o `?pagina=-5`. Sin este
    recorte, PostgREST recibiría un rango negativo y respondería con un error
    que el usuario no puede entender ni corregir.
  */
  it('una página inválida cae en la primera', () => {
    expect(rangoDePagina(0, 30)).toEqual([0, 29])
    expect(rangoDePagina(-5, 30)).toEqual([0, 29])
    expect(rangoDePagina(1.7, 30)).toEqual([0, 29])
  })

  it('calcula cuántas páginas hay', () => {
    expect(totalDePaginas(0, 30)).toBe(1)
    expect(totalDePaginas(30, 30)).toBe(1)
    expect(totalDePaginas(31, 30)).toBe(2)
    expect(totalDePaginas(6570, 30)).toBe(219)
  })

  it('el tamaño de página es razonable para un teléfono', () => {
    expect(POR_PAGINA).toBeGreaterThanOrEqual(20)
    expect(POR_PAGINA).toBeLessThanOrEqual(50)
  })
})
