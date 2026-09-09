import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RestablecerClave } from './RestablecerClave'

// La acción real es una Server Action; aquí solo importa el comportamiento del
// componente, así que se sustituye por una que no hace nada.
vi.mock('@/app/(app)/configuracion/usuarios/actions', () => ({
  restablecerClaveAction: vi.fn(async () => ({ error: '' })),
}))

describe('RestablecerClave', () => {
  it('empieza cerrado, con solo el disparador', () => {
    render(<RestablecerClave usuarioId="u1" nombre="Lab kevin" />)
    expect(screen.getByRole('button', { name: /restablecer contraseña/i })).toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña nueva')).not.toBeInTheDocument()
  })

  it('al abrirlo pide la contraseña y dice de quién es', async () => {
    render(<RestablecerClave usuarioId="u1" nombre="Lab kevin" />)
    await userEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }))
    expect(screen.getByLabelText('Contraseña nueva')).toBeInTheDocument()
    expect(screen.getByLabelText('Repite la contraseña')).toBeInTheDocument()
    expect(screen.getByText(/Lab kevin/)).toBeInTheDocument()
  })

  it('manda el identificador del usuario en un campo oculto', async () => {
    const { container } = render(<RestablecerClave usuarioId="u1" nombre="Lab kevin" />)
    await userEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }))
    expect(container.querySelector('input[type=hidden][name=id]')).toHaveAttribute(
      'value',
      'u1',
    )
  })

  it('se puede cerrar sin guardar nada', async () => {
    render(<RestablecerClave usuarioId="u1" nombre="Lab kevin" />)
    await userEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.queryByLabelText('Contraseña nueva')).not.toBeInTheDocument()
  })

  it('exige el mínimo de 6 caracteres también en el navegador', async () => {
    render(<RestablecerClave usuarioId="u1" nombre="Lab kevin" />)
    await userEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }))
    expect(screen.getByLabelText('Contraseña nueva')).toHaveAttribute('minLength', '6')
  })
})
