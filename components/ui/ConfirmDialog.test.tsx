import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

const props = {
  action: async () => {},
  fields: { id: 'abc' },
  triggerLabel: 'Eliminar',
  title: 'Eliminar trabajo',
  message: 'Se borra el trabajo, sus etapas y sus abonos. No se puede deshacer.',
  confirmLabel: 'Sí, eliminar',
}

describe('ConfirmDialog', () => {
  it('empieza cerrado y se abre al tocar el disparador', async () => {
    render(<ConfirmDialog {...props} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(props.message)).toBeInTheDocument()
  })

  it('envía los campos ocultos que recibe la acción', async () => {
    render(<ConfirmDialog {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    const oculto = document.querySelector('input[name=id]') as HTMLInputElement
    expect(oculto.value).toBe('abc')
  })

  it('el botón destructivo usa el rótulo indicado', async () => {
    render(<ConfirmDialog {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByRole('button', { name: 'Sí, eliminar' })).toBeInTheDocument()
  })

  it('se puede cancelar', async () => {
    render(<ConfirmDialog {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
