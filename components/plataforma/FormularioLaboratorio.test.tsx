import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormularioLaboratorio } from './FormularioLaboratorio'

const nada = vi.fn(async () => ({ error: '' }))

describe('FormularioLaboratorio', () => {
  it('pide el laboratorio y los datos de su administrador', () => {
    render(<FormularioLaboratorio action={nada} />)
    expect(screen.getByLabelText('Nombre del laboratorio')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre del administrador')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo del administrador')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña inicial')).toBeInTheDocument()
  })

  it('usa los nombres de campo que espera la acción', () => {
    render(<FormularioLaboratorio action={nada} />)
    expect(screen.getByLabelText('Nombre del laboratorio')).toHaveAttribute(
      'name',
      'laboratorio',
    )
    expect(screen.getByLabelText('Nombre del administrador')).toHaveAttribute(
      'name',
      'adminNombre',
    )
    expect(screen.getByLabelText('Correo del administrador')).toHaveAttribute(
      'name',
      'adminEmail',
    )
    expect(screen.getByLabelText('Contraseña inicial')).toHaveAttribute(
      'name',
      'adminPassword',
    )
  })

  // El laboratorio arranca vacío por decisión del cliente, así que quien lo da
  // de alta tiene que saberlo antes de entregar el acceso.
  it('avisa de que el laboratorio arranca sin catálogo', () => {
    render(<FormularioLaboratorio action={nada} />)
    expect(screen.getByText(/sin catálogo/i)).toBeInTheDocument()
  })

  it('muestra el error del servidor', () => {
    render(
      <FormularioLaboratorio
        action={nada}
        errorInicial="Ese correo ya tiene una cuenta en la plataforma"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('ya tiene una cuenta')
  })

  it('exige el mínimo de contraseña también en el navegador', () => {
    render(<FormularioLaboratorio action={nada} />)
    expect(screen.getByLabelText('Contraseña inicial')).toHaveAttribute('minLength', '6')
  })
})
