import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PantallaSuspendida } from './PantallaSuspendida'

describe('PantallaSuspendida', () => {
  it('dice claramente que la cuenta está suspendida', () => {
    render(<PantallaSuspendida rol="admin" />)
    expect(screen.getByRole('heading', { name: /cuenta suspendida/i })).toBeInTheDocument()
  })

  it('al administrador le explica que hay un pago pendiente', () => {
    render(<PantallaSuspendida rol="admin" />)
    expect(screen.getByText(/pago pendiente/i)).toBeInTheDocument()
  })

  it('al técnico le dice a quién avisar, porque él no puede pagar', () => {
    render(<PantallaSuspendida rol="tecnico" />)
    expect(screen.getByText(/administrador/i)).toBeInTheDocument()
  })

  it('siempre deja salir: no puede ser una pantalla sin escape', () => {
    render(<PantallaSuspendida rol="tecnico" />)
    expect(screen.getByRole('link', { name: /salir/i })).toHaveAttribute(
      'href',
      '/login/logout',
    )
  })

  it('muestra el contacto cuando se le pasa', () => {
    render(<PantallaSuspendida rol="admin" contacto="ventas@ejemplo.pe" />)
    expect(screen.getByText('ventas@ejemplo.pe')).toBeInTheDocument()
  })

  it('no inventa un contacto cuando no se le pasa', () => {
    render(<PantallaSuspendida rol="admin" />)
    expect(screen.queryByText(/@/)).not.toBeInTheDocument()
  })

  it('no muestra ningún dato del laboratorio', () => {
    const { container } = render(<PantallaSuspendida rol="admin" />)
    expect(container.querySelectorAll('table')).toHaveLength(0)
  })
})
