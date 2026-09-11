import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EnlaceAccion } from './EnlaceAccion'

describe('EnlaceAccion', () => {
  it('es un enlace con su destino y su texto', () => {
    render(<EnlaceAccion href="/finanzas/gastos">Registrar un gasto</EnlaceAccion>)
    const enlace = screen.getByRole('link', { name: 'Registrar un gasto' })
    expect(enlace.getAttribute('href')).toBe('/finanzas/gastos')
  })

  /*
    Tiene que parecer un botón, no texto. El fallo que lo originó fue
    exactamente ese: la acción existía como enlace de 13 px y en pantalla ancha
    nadie la veía. Si alguien le quita el borde o la altura, esta prueba avisa.
  */
  it('se ve como un botón: borde y altura de toque', () => {
    render(<EnlaceAccion href="/x">Acción</EnlaceAccion>)
    const clases = screen.getByRole('link').className
    expect(clases).toContain('border')
    expect(clases).toContain('h-11')
  })

  /*
    Ancho completo en móvil, solo lo necesario en pantalla grande: una barra de
    880 px para dos palabras se lee como un error de maquetación.
  */
  it('ocupa el ancho en móvil y se ajusta en pantalla grande', () => {
    render(<EnlaceAccion href="/x">Acción</EnlaceAccion>)
    const clases = screen.getByRole('link').className
    expect(clases).toContain('w-full')
    expect(clases).toContain('sm:w-auto')
  })
})
