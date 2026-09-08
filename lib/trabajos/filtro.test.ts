import { describe, it, expect } from 'vitest'
import { filtrarTrabajos, contarPorEstado } from './filtro'

const lista = [
  {
    tipo_nombre: 'Corona porcelana',
    paciente_nombre: 'Juan Díaz',
    doctor_nombre: 'Dr. Pérez',
    consultorio_nombre: 'Arte oral',
    estado: 'en_curso' as const,
  },
  {
    tipo_nombre: 'Férula',
    paciente_nombre: null,
    doctor_nombre: 'Dra. Meza',
    consultorio_nombre: 'Claudia Meza',
    estado: 'cerrado' as const,
  },
  {
    tipo_nombre: 'Reparación',
    paciente_nombre: 'Ana',
    doctor_nombre: 'Dr. Pérez',
    consultorio_nombre: 'Arte oral',
    estado: 'entregado' as const,
  },
]

describe('filtrarTrabajos', () => {
  it('sin búsqueda devuelve todo', () => {
    expect(filtrarTrabajos(lista, '')).toHaveLength(3)
    expect(filtrarTrabajos(lista, '   ')).toHaveLength(3)
  })

  it('busca por tipo de trabajo', () => {
    expect(filtrarTrabajos(lista, 'corona')).toHaveLength(1)
  })

  it('busca por paciente ignorando tildes', () => {
    expect(filtrarTrabajos(lista, 'diaz')).toHaveLength(1)
  })

  it('busca por doctor y por consultorio', () => {
    expect(filtrarTrabajos(lista, 'perez')).toHaveLength(2)
    expect(filtrarTrabajos(lista, 'arte oral')).toHaveLength(2)
  })

  it('exige todas las palabras', () => {
    expect(filtrarTrabajos(lista, 'corona juan')).toHaveLength(1)
    expect(filtrarTrabajos(lista, 'corona meza')).toHaveLength(0)
  })

  it('coincide por subcadena, para poder escribir de a poco', () => {
    expect(filtrarTrabajos(lista, 'coro')).toHaveLength(1)
    // "porcelana" contiene "ana": la coincidencia parcial es intencional.
    expect(filtrarTrabajos(lista, 'ana')).toHaveLength(2)
  })

  it('tolera pacientes sin nombre', () => {
    expect(filtrarTrabajos(lista, 'ferula')).toHaveLength(1)
  })
})

describe('contarPorEstado', () => {
  it('cuenta el total y cada estado', () => {
    expect(contarPorEstado(lista)).toEqual({
      todos: 3,
      en_curso: 1,
      cerrado: 1,
      entregado: 1,
    })
  })

  it('lista vacía cuenta cero', () => {
    expect(contarPorEstado([])).toEqual({
      todos: 0,
      en_curso: 0,
      cerrado: 0,
      entregado: 0,
    })
  })
})
