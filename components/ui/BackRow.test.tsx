import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BackRow } from './BackRow'

describe('BackRow', () => {
  it('muestra el título como encabezado', () => {
    render(<BackRow href="/trabajos" titulo="Nuevo trabajo" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nuevo trabajo')
  })

  it('el retorno es un enlace accesible al destino', () => {
    render(<BackRow href="/trabajos" titulo="Nuevo trabajo" />)
    const enlace = screen.getByRole('link', { name: /volver/i })
    expect(enlace).toHaveAttribute('href', '/trabajos')
  })

  it('muestra la miga de pan cuando se indica', () => {
    render(<BackRow href="/configuracion" titulo="Catálogo" migaDePan="Configuración" />)
    expect(screen.getByText('Configuración')).toBeInTheDocument()
  })
})
