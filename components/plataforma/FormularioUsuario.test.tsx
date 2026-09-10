import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormularioUsuario } from './FormularioUsuario'

const nada = vi.fn(async () => ({ error: '' }))

describe('FormularioUsuario', () => {
  it('pide nombre, correo, contraseña y rol', () => {
    render(<FormularioUsuario labId="l1" action={nada} />)
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('name', 'nombre')
    expect(screen.getByLabelText('Correo (para iniciar sesión)')).toHaveAttribute('name', 'email')
    expect(screen.getByLabelText('Contraseña inicial')).toHaveAttribute('name', 'password')
    expect(screen.getByLabelText('Rol')).toHaveAttribute('name', 'rol')
  })

  // Sin esto la acción no sabría en qué laboratorio crear al usuario, y el
  // identificador no puede venir de la URL: la acción se invoca sin ella.
  it('lleva el laboratorio en el envío', () => {
    const { container } = render(<FormularioUsuario labId="l1" action={nada} />)
    expect(container.querySelector('input[name="laboratorio_id"]')).toHaveAttribute(
      'value',
      'l1',
    )
  })

  it('arranca en técnico, que es el rol que casi siempre se crea', () => {
    render(<FormularioUsuario labId="l1" action={nada} />)
    expect(screen.getByLabelText('Rol')).toHaveValue('tecnico')
  })

  it('muestra el error del servidor', () => {
    render(
      <FormularioUsuario labId="l1" action={nada} errorInicial="Ese correo ya está registrado" />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('ya está registrado')
  })
})
