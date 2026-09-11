import { describe, it, expect } from 'vitest'
import { ordenarPorConsultorio } from './orden'

function d(consultorio_nombre: string, nombre: string) {
  return { id: `${consultorio_nombre}-${nombre}`, nombre, consultorio_nombre }
}

describe('ordenarPorConsultorio', () => {
  /*
    El laboratorio piensa por consultorio: «los de Arte oral». Ordenar solo por
    doctor deja los grupos salteados —un doctor de Arte oral, otro de Visión,
    otro de Arte oral— y obliga a recorrer la lista entera para ver quién es de
    dónde.
  */
  it('agrupa por consultorio en orden alfabético', () => {
    const lista = [d('Visión dental', 'Ruiz'), d('Arte oral', 'Meza'), d('Visión dental', 'Díaz')]
    expect(ordenarPorConsultorio(lista).map((x) => x.consultorio_nombre)).toEqual([
      'Arte oral',
      'Visión dental',
      'Visión dental',
    ])
  })

  it('dentro de cada consultorio, los doctores en orden', () => {
    const lista = [d('Arte oral', 'Ruiz'), d('Arte oral', 'Díaz'), d('Arte oral', 'Meza')]
    expect(ordenarPorConsultorio(lista).map((x) => x.nombre)).toEqual([
      'Díaz',
      'Meza',
      'Ruiz',
    ])
  })

  /*
    Orden en español: la eñe va después de la ene, y las tildes no alteran la
    posición de la letra. Con `<` de JavaScript, «Ñuñez» caería después de «Z».
  */
  it('ordena la eñe y las tildes como el español', () => {
    const lista = [d('Zeta', 'a'), d('Ñandú', 'a'), d('Nube', 'a'), d('Ábaco', 'a')]
    expect(ordenarPorConsultorio(lista).map((x) => x.consultorio_nombre)).toEqual([
      'Ábaco',
      'Nube',
      'Ñandú',
      'Zeta',
    ])
  })

  it('no distingue mayúsculas para ordenar', () => {
    const lista = [d('beta', 'a'), d('Alfa', 'a')]
    expect(ordenarPorConsultorio(lista).map((x) => x.consultorio_nombre)).toEqual([
      'Alfa',
      'beta',
    ])
  })

  it('no modifica la lista recibida', () => {
    const lista = [d('Zeta', 'a'), d('Alfa', 'a')]
    ordenarPorConsultorio(lista)
    expect(lista[0]!.consultorio_nombre).toBe('Zeta')
  })

  it('con la lista vacía no falla', () => {
    expect(ordenarPorConsultorio([])).toEqual([])
  })
})
