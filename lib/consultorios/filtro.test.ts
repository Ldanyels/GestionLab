import { describe, it, expect } from 'vitest'
import { filtrarDoctores } from './filtro'

const doctores = [
  { id: '1', nombre: 'Dra. Ruiz', consultorio_nombre: 'Arte oral' },
  { id: '2', nombre: 'Dr. Muñoz', consultorio_nombre: 'Visión dental' },
  { id: '3', nombre: 'Dra. Meza', consultorio_nombre: 'Arte oral' },
]

describe('filtrarDoctores', () => {
  it('sin búsqueda devuelve todos', () => {
    expect(filtrarDoctores(doctores, '')).toHaveLength(3)
    expect(filtrarDoctores(doctores, '   ')).toHaveLength(3)
  })

  it('busca por el nombre del doctor', () => {
    expect(filtrarDoctores(doctores, 'ruiz').map((d) => d.id)).toEqual(['1'])
  })

  it('busca también por consultorio', () => {
    expect(filtrarDoctores(doctores, 'arte').map((d) => d.id)).toEqual(['1', '3'])
  })

  /*
    Quien tiene prisa escribe «munoz». Si el buscador exigiera la eñe y la
    tilde, obligaría a buscar el carácter en el teclado del teléfono, que es
    más lento que desplazar la lista —y entonces el buscador no serviría de
    nada.
  */
  it('ignora tildes y eñes', () => {
    expect(filtrarDoctores(doctores, 'munoz').map((d) => d.id)).toEqual(['2'])
    expect(filtrarDoctores(doctores, 'vision').map((d) => d.id)).toEqual(['2'])
  })

  it('ignora mayúsculas', () => {
    expect(filtrarDoctores(doctores, 'RUIZ').map((d) => d.id)).toEqual(['1'])
  })

  /*
    Con treinta y nueve doctores, buscar «alguna palabra» devuelve media lista.
    «arte ruiz» tiene que dar una sola doctora.
  */
  it('exige todas las palabras, en cualquier orden', () => {
    expect(filtrarDoctores(doctores, 'arte ruiz').map((d) => d.id)).toEqual(['1'])
    expect(filtrarDoctores(doctores, 'ruiz arte').map((d) => d.id)).toEqual(['1'])
  })

  it('sin coincidencias devuelve vacío', () => {
    expect(filtrarDoctores(doctores, 'zzz')).toEqual([])
  })
})
