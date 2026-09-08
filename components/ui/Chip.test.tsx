import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Chip } from './Chip'

describe('Chip', () => {
  it('muestra su texto', () => {
    render(<Chip tono="acento">En curso</Chip>)
    expect(screen.getByText('En curso')).toBeInTheDocument()
  })

  it('aplica el par de colores del tono', () => {
    const { container } = render(<Chip tono="peligro">Vencido</Chip>)
    const cls = (container.firstElementChild as HTMLElement).className
    expect(cls).toContain('bg-[var(--color-danger-soft)]')
    expect(cls).toContain('text-[var(--color-danger)]')
  })

  it('no permite que el texto se quiebre', () => {
    const { container } = render(<Chip tono="neutro">Pendiente</Chip>)
    expect((container.firstElementChild as HTMLElement).className).toContain('whitespace-nowrap')
  })

  it('con conPunto agrega el punto de 6 px', () => {
    const { container } = render(
      <Chip tono="exito" conPunto>
        Entregado
      </Chip>,
    )
    expect(container.querySelector('[aria-hidden]')).not.toBeNull()
  })
})
