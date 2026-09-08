import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from './Sheet'

describe('Sheet', () => {
  it('no renderiza nada cuando está cerrada', () => {
    render(
      <Sheet abierta={false} onCerrar={() => {}} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('abierta muestra título y contenido en un diálogo modal', () => {
    render(
      <Sheet abierta onCerrar={() => {}} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    const dialogo = screen.getByRole('dialog')
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Tipo de trabajo')).toBeInTheDocument()
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })

  it('cierra con el botón de cierre', async () => {
    const onCerrar = vi.fn()
    render(
      <Sheet abierta onCerrar={onCerrar} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(onCerrar).toHaveBeenCalledOnce()
  })

  it('cierra con la tecla Escape', async () => {
    const onCerrar = vi.fn()
    render(
      <Sheet abierta onCerrar={onCerrar} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onCerrar).toHaveBeenCalledOnce()
  })
})
