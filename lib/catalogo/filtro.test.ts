import { describe, it, expect } from 'vitest'
import { filtrarTipos } from './filtro'

const tipos = [
  { nombre: 'Corona de metal cerámica', categoria: 'Prótesis Fija' },
  { nombre: 'Prótesis total acrílica', categoria: 'Prótesis Total' },
  { nombre: 'Férula de descarga', categoria: 'Ortodoncia/Ortopedia' },
]

describe('filtrarTipos', () => {
  it('devuelve todo cuando la búsqueda está vacía', () => {
    expect(filtrarTipos(tipos, '')).toHaveLength(3)
    expect(filtrarTipos(tipos, '   ')).toHaveLength(3)
  })

  it('filtra por nombre sin importar mayúsculas', () => {
    const r = filtrarTipos(tipos, 'CORONA')
    expect(r).toHaveLength(1)
    expect(r[0].nombre).toBe('Corona de metal cerámica')
  })

  it('ignora tildes en la búsqueda y en el nombre', () => {
    expect(filtrarTipos(tipos, 'ceramica')).toHaveLength(1)
    expect(filtrarTipos(tipos, 'férula')).toHaveLength(1)
    expect(filtrarTipos(tipos, 'ferula')).toHaveLength(1)
  })

  it('también busca por categoría', () => {
    expect(filtrarTipos(tipos, 'ortodoncia')).toHaveLength(1)
  })

  it('todas las palabras deben coincidir', () => {
    expect(filtrarTipos(tipos, 'protesis total')).toHaveLength(1)
    expect(filtrarTipos(tipos, 'corona acrilica')).toHaveLength(0)
  })
})
