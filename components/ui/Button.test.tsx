import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renderiza el texto y aplica variante primaria', () => {
    render(<Button variant="primary">Guardar</Button>)
    const btn = screen.getByRole('button', { name: 'Guardar' })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain('bg-[var(--color-accent)]')
  })
  it('usa variante primaria por defecto', () => {
    render(<Button>Ok</Button>)
    expect(screen.getByRole('button', { name: 'Ok' }).className).toContain(
      'bg-[var(--color-accent)]',
    )
  })
})
