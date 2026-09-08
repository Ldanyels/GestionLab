import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PantallaDeError } from './PantallaDeError'

describe('PantallaDeError', () => {
  it('muestra un título y una explicación por defecto', () => {
    render(<PantallaDeError />)
    expect(screen.getByRole('heading', { name: /algo salió mal/i })).toBeInTheDocument()
    expect(screen.getByText(/vuelve a intentarlo/i)).toBeInTheDocument()
  })

  it('acepta título y explicación propios', () => {
    render(<PantallaDeError titulo="No encontramos esa página" explicacion="Quizá se movió." />)
    expect(
      screen.getByRole('heading', { name: 'No encontramos esa página' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Quizá se movió.')).toBeInTheDocument()
  })

  it('muestra el identificador del error para poder reportarlo', () => {
    render(<PantallaDeError digest="a1b2c3d4" />)
    expect(screen.getByText(/a1b2c3d4/)).toBeInTheDocument()
  })

  it('no muestra bloque de identificador cuando no hay digest', () => {
    render(<PantallaDeError />)
    expect(screen.queryByText(/código del error/i)).not.toBeInTheDocument()
  })

  it('llama a onReintentar al pulsar el botón', async () => {
    const reintentar = vi.fn()
    render(<PantallaDeError onReintentar={reintentar} />)
    await userEvent.click(screen.getByRole('button', { name: /volver a intentar/i }))
    expect(reintentar).toHaveBeenCalledOnce()
  })

  it('omite el botón de reintentar si no se puede reintentar', () => {
    render(<PantallaDeError />)
    expect(screen.queryByRole('button', { name: /volver a intentar/i })).not.toBeInTheDocument()
  })

  it('ofrece una salida a Hoy por defecto', () => {
    render(<PantallaDeError />)
    const salida = screen.getByRole('link', { name: /ir a hoy/i })
    expect(salida).toHaveAttribute('href', '/hoy')
  })

  it('acepta otra salida', () => {
    render(<PantallaDeError hrefSalida="/login" etiquetaSalida="Ir al inicio de sesión" />)
    expect(screen.getByRole('link', { name: /inicio de sesión/i })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('muestra el detalle técnico cuando se le pasa', () => {
    render(<PantallaDeError detalle='relation "trabajo" does not exist' />)
    expect(screen.getByText(/relation "trabajo" does not exist/)).toBeInTheDocument()
  })

  it('no muestra detalle técnico si no se le pasa: en producción no debe filtrarse', () => {
    render(<PantallaDeError digest="abc" />)
    expect(screen.queryByText(/detalle técnico/i)).not.toBeInTheDocument()
  })
})
