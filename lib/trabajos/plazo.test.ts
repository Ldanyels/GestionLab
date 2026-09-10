import { describe, it, expect } from 'vitest'
import {
  ATAJOS_DE_PLAZO,
  plazoDelTrabajo,
  diasDePlazoSchema,
  estadoDeEntrega,
  fechaSugerida,
  ordenarPorEntrega,
  porEntregar,
} from './plazo'

describe('fechaSugerida', () => {
  it('suma los días del tipo de trabajo a la fecha de ingreso', () => {
    expect(fechaSugerida('2026-09-10', 3)).toBe('2026-09-13')
  })

  /*
    Sin plazo definido no se inventa ninguno. Un tipo de trabajo recién creado
    no tiene días, y rellenar la fecha con un valor arbitrario sería peor que
    dejarla vacía: el laboratorio confiaría en un plazo que nadie prometió.
  */
  it('sin días definidos no sugiere nada', () => {
    expect(fechaSugerida('2026-09-10', null)).toBeNull()
    expect(fechaSugerida('2026-09-10', undefined)).toBeNull()
  })

  it('cero días es el mismo día, no «sin plazo»', () => {
    expect(fechaSugerida('2026-09-10', 0)).toBe('2026-09-10')
  })

  it('cruza el fin de mes', () => {
    expect(fechaSugerida('2026-09-28', 5)).toBe('2026-10-03')
  })

  it('cruza el fin de año', () => {
    expect(fechaSugerida('2026-12-30', 3)).toBe('2027-01-02')
  })

  it('cuenta el 29 de febrero en año bisiesto', () => {
    expect(fechaSugerida('2028-02-27', 3)).toBe('2028-03-01')
  })
})

describe('diasDePlazoSchema', () => {
  it('acepta un número de días', () => {
    expect(diasDePlazoSchema.parse('3')).toBe(3)
  })

  /*
    El campo vacío significa «este tipo no tiene plazo», no cero días. Si se
    tradujera a cero, cada trabajo de ese tipo nacería con la entrega para hoy.
  */
  it('vacío es sin plazo, no cero', () => {
    expect(diasDePlazoSchema.parse('')).toBeNull()
    expect(diasDePlazoSchema.parse(null)).toBeNull()
  })

  it('rechaza negativos: no se entrega antes de recibir', () => {
    expect(diasDePlazoSchema.safeParse('-1').success).toBe(false)
  })

  it('rechaza decimales', () => {
    expect(diasDePlazoSchema.safeParse('2.5').success).toBe(false)
  })

  it('rechaza plazos absurdos', () => {
    expect(diasDePlazoSchema.safeParse('4000').success).toBe(false)
  })
})

describe('estadoDeEntrega', () => {
  const hoy = '2026-09-10'

  it('sin fecha no es un problema, es un dato que falta', () => {
    expect(estadoDeEntrega({ fecha_entrega: null, estado: 'en_curso' }, hoy)).toBe('sin_fecha')
  })

  it('la fecha de hoy urge hoy', () => {
    expect(estadoDeEntrega({ fecha_entrega: hoy, estado: 'en_curso' }, hoy)).toBe('hoy')
  })

  it('una fecha pasada está atrasada', () => {
    expect(estadoDeEntrega({ fecha_entrega: '2026-09-08', estado: 'en_curso' }, hoy)).toBe(
      'atrasada',
    )
  })

  it('una fecha futura solo está próxima', () => {
    expect(estadoDeEntrega({ fecha_entrega: '2026-09-20', estado: 'en_curso' }, hoy)).toBe(
      'proxima',
    )
  })

  /*
    Un trabajo ya entregado nunca está atrasado, aunque su fecha haya pasado.
    Sin esta regla, los 16 entregados de MasterLab aparecerían todos como
    atrasados el día que se les ponga fecha, y el aviso dejaría de significar
    nada.
  */
  it('lo ya entregado no está atrasado aunque la fecha haya pasado', () => {
    expect(estadoDeEntrega({ fecha_entrega: '2026-08-01', estado: 'entregado' }, hoy)).toBe(
      'entregada',
    )
    expect(estadoDeEntrega({ fecha_entrega: '2026-08-01', estado: 'cerrado' }, hoy)).toBe(
      'entregada',
    )
  })
})

describe('porEntregar', () => {
  const hoy = '2026-09-10'
  const lista = [
    { id: '1', fecha_entrega: '2026-09-08', estado: 'en_curso' },
    { id: '2', fecha_entrega: hoy, estado: 'en_curso' },
    { id: '3', fecha_entrega: '2026-09-25', estado: 'en_curso' },
    { id: '4', fecha_entrega: null, estado: 'en_curso' },
    { id: '5', fecha_entrega: '2026-09-01', estado: 'entregado' },
  ]

  it('lo atrasado y lo de hoy, nada más', () => {
    expect(porEntregar(lista, hoy).map((t) => t.id)).toEqual(['1', '2'])
  })

  it('lo atrasado va primero, y entre atrasados el más viejo arriba', () => {
    const conDos = [
      { id: 'nuevo', fecha_entrega: '2026-09-09', estado: 'en_curso' },
      { id: 'viejo', fecha_entrega: '2026-09-02', estado: 'en_curso' },
    ]
    expect(porEntregar(conDos, hoy).map((t) => t.id)).toEqual(['viejo', 'nuevo'])
  })
})

describe('ordenarPorEntrega', () => {
  /*
    Los sin fecha van al final, no al principio. Un null ordenado como cadena
    vacía se colaría arriba de todo y taparía justo lo que urge.
  */
  it('los sin fecha quedan al final', () => {
    const lista = [
      { id: 'a', fecha_entrega: null },
      { id: 'b', fecha_entrega: '2026-09-20' },
      { id: 'c', fecha_entrega: '2026-09-05' },
    ]
    expect(ordenarPorEntrega(lista).map((t) => t.id)).toEqual(['c', 'b', 'a'])
  })

  it('no modifica la lista recibida', () => {
    const lista = [
      { id: 'a', fecha_entrega: '2026-09-20' },
      { id: 'b', fecha_entrega: '2026-09-05' },
    ]
    ordenarPorEntrega(lista)
    expect(lista.map((t) => t.id)).toEqual(['a', 'b'])
  })
})

describe('ATAJOS_DE_PLAZO', () => {
  /*
    Los atajos existen porque un laboratorio cotiza en días («acrílico, 3
    días»), no en fechas de calendario. Si hubiera que abrir el selector de
    fecha y buscar el día, seguiría pasando lo de hoy: 46 de 47 trabajos sin
    fecha.
  */
  it('cuentan desde el ingreso, no desde hoy', () => {
    const ingreso = '2026-09-10'
    expect(ATAJOS_DE_PLAZO.map((a) => fechaSugerida(ingreso, a.dias))).toEqual([
      '2026-09-11',
      '2026-09-13',
      '2026-09-17',
    ])
  })

  it('cada atajo dice en palabras lo que hace', () => {
    expect(ATAJOS_DE_PLAZO.map((a) => a.etiqueta)).toEqual(['Mañana', '3 días', '1 semana'])
  })
})

describe('plazoDelTrabajo', () => {
  /*
    Gana el plazo más largo, no el del primer tipo ni el promedio.

    Un trabajo con una corona de 3 días y una prótesis de 10 no está listo en 3:
    no está listo hasta que lo esté la pieza más lenta. Tomar el más corto haría
    que el sistema prometiera al consultorio una fecha que el laboratorio no
    puede cumplir, que es peor que no prometer nada.
  */
  it('gana el plazo más largo', () => {
    expect(plazoDelTrabajo([{ dias_entrega: 3 }, { dias_entrega: 10 }])).toBe(10)
  })

  it('ignora los tipos sin plazo, pero respeta el de los que sí tienen', () => {
    expect(plazoDelTrabajo([{ dias_entrega: null }, { dias_entrega: 4 }])).toBe(4)
  })

  it('si ningún tipo tiene plazo, no hay plazo', () => {
    expect(plazoDelTrabajo([{ dias_entrega: null }, { dias_entrega: null }])).toBeNull()
    expect(plazoDelTrabajo([])).toBeNull()
  })

  /*
    Cero es un plazo, no la ausencia de uno: un ajuste que se entrega el mismo
    día. Si se confundiera con «sin plazo», ese tipo nunca sugeriría fecha.
  */
  it('cero días es un plazo válido', () => {
    expect(plazoDelTrabajo([{ dias_entrega: 0 }])).toBe(0)
  })

  it('cero no pisa un plazo mayor de otra línea', () => {
    expect(plazoDelTrabajo([{ dias_entrega: 0 }, { dias_entrega: 5 }])).toBe(5)
  })
})
