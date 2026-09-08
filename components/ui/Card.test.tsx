import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('renderiza su contenido', () => {
    render(<Card>Contenido</Card>)
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('usa radio 16 en tono sección y 14 en tono lista', () => {
    const { container: seccion } = render(<Card tono="seccion">a</Card>)
    const { container: lista } = render(<Card tono="lista">b</Card>)
    expect(seccion.firstElementChild?.className).toContain('rounded-[var(--radius-lg)]')
    expect(lista.firstElementChild?.className).toContain('rounded-[14px]')
  })

  it('pinta el borde izquierdo con el color del consultorio', () => {
    const { container } = render(<Card colorLateral="#db2777">a</Card>)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.borderLeftColor).toBe('rgb(219, 39, 119)')
    expect(el.className).toContain('border-l-4')
  })

  it('sin colorLateral no agrega borde de color', () => {
    const { container } = render(<Card>a</Card>)
    expect((container.firstElementChild as HTMLElement).className).not.toContain('border-l-4')
  })
})
