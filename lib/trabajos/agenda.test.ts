import { describe, it, expect } from 'vitest'
import {
  entregasDelDia,
  fechaLarga,
  hoyLima,
  ingresadosDelDia,
  pendientesDelDia,
  realizadosDelDia,
  sinRepetir,
} from './agenda'

const trabajos = [
  { id: 'hoy1', fecha_entrega: '2026-09-08' },
  { id: 'ayer', fecha_entrega: '2026-09-07' },
  { id: 'manana', fecha_entrega: '2026-09-09' },
  { id: 'sinfecha', fecha_entrega: null },
  { id: 'hoy2', fecha_entrega: '2026-09-08' },
]

describe('entregasDelDia', () => {
  it('deja solo los del día indicado', () => {
    expect(entregasDelDia(trabajos, '2026-09-08').map((t) => t.id)).toEqual([
      'hoy1',
      'hoy2',
    ])
  })

  it('excluye atrasados, futuros y sin fecha', () => {
    const ids = entregasDelDia(trabajos, '2026-09-08').map((t) => t.id)
    expect(ids).not.toContain('ayer')
    expect(ids).not.toContain('manana')
    expect(ids).not.toContain('sinfecha')
  })

  it('sin coincidencias devuelve lista vacía', () => {
    expect(entregasDelDia(trabajos, '2026-01-01')).toEqual([])
  })
})

// El día de trabajo real: unas entregas siguen en curso y otras ya se hicieron.
const jornada = [
  { id: 'pend1', fecha_entrega: '2026-09-08', estado: 'en_curso' as const },
  { id: 'cerrado', fecha_entrega: '2026-09-08', estado: 'cerrado' as const },
  { id: 'entregado', fecha_entrega: '2026-09-08', estado: 'entregado' as const },
  { id: 'pend2', fecha_entrega: '2026-09-08', estado: 'en_curso' as const },
  { id: 'ayer-hecho', fecha_entrega: '2026-09-07', estado: 'entregado' as const },
  { id: 'manana', fecha_entrega: '2026-09-09', estado: 'en_curso' as const },
  { id: 'sinfecha', fecha_entrega: null, estado: 'cerrado' as const },
]

describe('pendientesDelDia', () => {
  it('deja solo las entregas de hoy que siguen en curso', () => {
    expect(pendientesDelDia(jornada, '2026-09-08').map((t) => t.id)).toEqual(['pend1', 'pend2'])
  })

  it('excluye las que ya se hicieron', () => {
    const ids = pendientesDelDia(jornada, '2026-09-08').map((t) => t.id)
    expect(ids).not.toContain('cerrado')
    expect(ids).not.toContain('entregado')
  })

  it('excluye otros días y las sin fecha', () => {
    const ids = pendientesDelDia(jornada, '2026-09-08').map((t) => t.id)
    expect(ids).not.toContain('manana')
    expect(ids).not.toContain('sinfecha')
  })
})

describe('realizadosDelDia', () => {
  // Este es el arreglo: antes la pantalla Hoy alimentaba la agenda solo con los
  // trabajos en curso, así que al marcar uno cerrado o entregado desaparecía de
  // la vista y el técnico no podía ver lo que había hecho en el día.
  it('devuelve las entregas de hoy que ya están cerradas o entregadas', () => {
    expect(realizadosDelDia(jornada, '2026-09-08').map((t) => t.id)).toEqual([
      'cerrado',
      'entregado',
    ])
  })

  it('no incluye las que siguen en curso', () => {
    const ids = realizadosDelDia(jornada, '2026-09-08').map((t) => t.id)
    expect(ids).not.toContain('pend1')
    expect(ids).not.toContain('pend2')
  })

  // Limitación conocida y deliberada: `trabajo` no guarda cuándo se terminó,
  // solo su fecha de entrega. "Realizado hoy" significa "entrega de hoy ya
  // hecha", no "terminado hoy". Un trabajo con entrega de ayer que se cierra
  // hoy no aparece.
  it('no incluye lo terminado hoy con fecha de entrega de otro día', () => {
    expect(realizadosDelDia(jornada, '2026-09-08').map((t) => t.id)).not.toContain('ayer-hecho')
  })

  it('excluye las sin fecha de entrega', () => {
    expect(realizadosDelDia(jornada, '2026-09-08').map((t) => t.id)).not.toContain('sinfecha')
  })

  it('juntas cubren exactamente las entregas del día', () => {
    const total =
      pendientesDelDia(jornada, '2026-09-08').length +
      realizadosDelDia(jornada, '2026-09-08').length
    expect(total).toBe(entregasDelDia(jornada, '2026-09-08').length)
  })

  it('sin coincidencias devuelve lista vacía', () => {
    expect(realizadosDelDia(jornada, '2026-01-01')).toEqual([])
  })
})

describe('ingresadosDelDia', () => {
  // Esta es la lista que de verdad se puede pintar: `fecha_ingreso` la llena la
  // base sola (default current_date), mientras que `fecha_entrega` viene en NULL
  // en los 18 trabajos de MasterLab porque nadie la usa.
  const ingresos = [
    { id: 'hoy1', fecha_ingreso: '2026-09-08', estado: 'en_curso' as const },
    { id: 'hoy2', fecha_ingreso: '2026-09-08', estado: 'entregado' as const },
    { id: 'ayer', fecha_ingreso: '2026-09-07', estado: 'en_curso' as const },
  ]

  it('devuelve los trabajos que ingresaron ese día', () => {
    expect(ingresadosDelDia(ingresos, '2026-09-08').map((t) => t.id)).toEqual(['hoy1', 'hoy2'])
  })

  it('no mira el estado: el trabajo del día incluye lo ya terminado', () => {
    expect(ingresadosDelDia(ingresos, '2026-09-08').map((t) => t.id)).toContain('hoy2')
  })

  it('excluye otros días', () => {
    expect(ingresadosDelDia(ingresos, '2026-09-08').map((t) => t.id)).not.toContain('ayer')
  })

  it('sin coincidencias devuelve lista vacía', () => {
    expect(ingresadosDelDia(ingresos, '2026-01-01')).toEqual([])
  })
})

describe('sinRepetir', () => {
  const lista = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('quita los que ya están listados en otra sección', () => {
    expect(sinRepetir(lista, [{ id: 'b' }]).map((t) => t.id)).toEqual(['a', 'c'])
  })

  it('con nada que excluir devuelve la lista igual', () => {
    expect(sinRepetir(lista, []).map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('un trabajo que ingresó hoy y se entrega hoy no se muestra dos veces', () => {
    const jornadaCompleta = [
      { id: 'mismo', fecha_ingreso: '2026-09-08', fecha_entrega: '2026-09-08', estado: 'en_curso' as const },
      { id: 'viejo', fecha_ingreso: '2026-09-01', fecha_entrega: '2026-09-08', estado: 'en_curso' as const },
    ]
    const delDia = ingresadosDelDia(jornadaCompleta, '2026-09-08')
    const entregas = sinRepetir(pendientesDelDia(jornadaCompleta, '2026-09-08'), delDia)
    expect(delDia.map((t) => t.id)).toEqual(['mismo'])
    expect(entregas.map((t) => t.id)).toEqual(['viejo'])
  })
})

describe('hoyLima', () => {
  it('devuelve una fecha ISO (YYYY-MM-DD)', () => {
    expect(hoyLima()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('fechaLarga', () => {
  it('escribe el día y el mes en español, sin coma y con una sola mayúscula', () => {
    expect(fechaLarga('2026-09-08')).toBe('Martes 8 de setiembre')
  })

  it('no deja el mes ni las preposiciones en mayúscula', () => {
    const texto = fechaLarga('2026-01-01')
    expect(texto).not.toContain('De ')
    expect(texto).toMatch(/^[A-ZÁÉÍÓÚ][a-záéíóú]+ \d{1,2} de [a-z]+$/)
  })
})
