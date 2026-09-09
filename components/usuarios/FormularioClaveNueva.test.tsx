import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormularioClaveNueva } from './FormularioClaveNueva'

const nada = vi.fn(async () => ({ error: '' }))

describe('FormularioClaveNueva', () => {
  it('pide la contraseña y su confirmación', () => {
    render(<FormularioClaveNueva action={nada} />)
    expect(screen.getByLabelText('Contraseña nueva')).toBeInTheDocument()
    expect(screen.getByLabelText('Repite la contraseña')).toBeInTheDocument()
  })

  it('avisa del mínimo de caracteres antes de intentar guardar', () => {
    render(<FormularioClaveNueva action={nada} />)
    expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument()
  })

  it('muestra el error que devuelve el servidor', () => {
    render(<FormularioClaveNueva action={nada} errorInicial="Las contraseñas no coinciden" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas no coinciden')
  })

  it('usa los nombres de campo que espera la acción', async () => {
    render(<FormularioClaveNueva action={nada} />)
    await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'abc123')
    expect(screen.getByLabelText('Contraseña nueva')).toHaveAttribute('name', 'password')
    expect(screen.getByLabelText('Repite la contraseña')).toHaveAttribute(
      'name',
      'confirmacion',
    )
  })

  // El navegador corta el envío antes de llegar al servidor, pero la validación
  // real sigue estando en el esquema: esto solo ahorra un viaje.
  it('exige el mínimo también en el navegador', () => {
    render(<FormularioClaveNueva action={nada} />)
    expect(screen.getByLabelText('Contraseña nueva')).toHaveAttribute('minLength', '6')
    expect(screen.getByLabelText('Contraseña nueva')).toBeRequired()
  })
})
