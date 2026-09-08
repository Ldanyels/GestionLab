import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiTile } from './KpiTile'

describe('KpiTile', () => {
  it('muestra etiqueta y valor', () => {
    render(<KpiTile etiqueta="Entregas de hoy" valor="7" />)
    expect(screen.getByText('Entregas de hoy')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('el valor usa la tipografía mono', () => {
    render(<KpiTile etiqueta="Por cobrar" valor="S/ 3,300.00" />)
    expect(screen.getByText('S/ 3,300.00').className).toContain('num')
  })

  it('el tono peligro pinta el valor en rojo', () => {
    render(<KpiTile etiqueta="Por cobrar" valor="S/ 10.00" tono="peligro" />)
    expect(screen.getByText('S/ 10.00').className).toContain('text-[var(--color-danger)]')
  })
})
