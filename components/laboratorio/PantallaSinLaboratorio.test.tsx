import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PantallaSinLaboratorio } from './PantallaSinLaboratorio'

describe('PantallaSinLaboratorio', () => {
  it('distingue la cuenta sin laboratorio del fallo de lectura', () => {
    render(<PantallaSinLaboratorio error={null} />)
    expect(screen.getByRole('heading')).toHaveTextContent('Cuenta sin laboratorio')

    render(<PantallaSinLaboratorio error="permission denied for table perfil" />)
    expect(screen.getByText(/No pudimos leer tu perfil/)).toBeInTheDocument()
  })

  it('muestra el detalle técnico solo cuando hubo fallo', () => {
    render(<PantallaSinLaboratorio error="columna inexistente" />)
    expect(screen.getByText(/columna inexistente/)).toBeInTheDocument()
  })

  it('siempre deja salir', () => {
    render(<PantallaSinLaboratorio error={null} />)
    expect(screen.getByRole('link', { name: 'Salir' })).toHaveAttribute(
      'href',
      '/login/logout',
    )
  })

  // Sin esto la cuenta de plataforma queda en un callejón sin salida: el login
  // siempre aterriza en /hoy, y esa cuenta no pertenece a ningún laboratorio.
  it('ofrece el panel de plataforma a quien lo administra', () => {
    render(<PantallaSinLaboratorio error={null} esSuperAdmin />)
    expect(screen.getByRole('link', { name: /Plataforma/ })).toHaveAttribute(
      'href',
      '/plataforma',
    )
  })

  it('no lo ofrece a una cuenta cualquiera sin laboratorio', () => {
    render(<PantallaSinLaboratorio error={null} />)
    expect(screen.queryByRole('link', { name: /Plataforma/ })).toBeNull()
  })
})
