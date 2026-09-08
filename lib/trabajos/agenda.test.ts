import { describe, it, expect } from 'vitest'
import { entregasDelDia, fechaLarga, hoyLima } from './agenda'

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

describe('hoyLima', () => {
  it('devuelve una fecha ISO (YYYY-MM-DD)', () => {
    expect(hoyLima()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('fechaLarga', () => {
  it('escribe el día y el mes en español', () => {
    const texto = fechaLarga('2026-09-08')
    expect(texto).toContain('8')
    expect(texto.toLowerCase()).toContain('setiembre')
  })
})
