import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('muestra la inicial en mayúscula', () => {
    render(<Avatar nombre="arte oral" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('ignora espacios al inicio', () => {
    render(<Avatar nombre="  jean" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('tiñe el fondo con el color del consultorio al 12 %', () => {
    const { container } = render(<Avatar nombre="Arte oral" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.backgroundColor).not.toBe('')
    expect(el.style.color).not.toBe('')
  })

  it('acepta un tamaño distinto', () => {
    const { container } = render(<Avatar nombre="Jean" tamano={52} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.width).toBe('52px')
    expect(el.style.height).toBe('52px')
  })

  it('con nombre vacío no rompe', () => {
    const { container } = render(<Avatar nombre="" />)
    expect(container.firstElementChild).not.toBeNull()
  })
})
