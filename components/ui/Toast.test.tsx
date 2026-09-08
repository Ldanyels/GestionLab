import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './Toast'

function Disparador() {
  const avisar = useToast()
  return (
    <button type="button" onClick={() => avisar('Orden actualizado')}>
      avisar
    </button>
  )
}

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  it('no muestra nada al inicio', () => {
    render(
      <ToastProvider>
        <Disparador />
      </ToastProvider>,
    )
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('muestra el mensaje al avisar', async () => {
    render(
      <ToastProvider>
        <Disparador />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'avisar' }))
    expect(screen.getByRole('status')).toHaveTextContent('Orden actualizado')
  })

  it('se cierra solo a los 2200 ms', async () => {
    render(
      <ToastProvider>
        <Disparador />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'avisar' }))
    act(() => {
      vi.advanceTimersByTime(2100)
    })
    expect(screen.queryByRole('status')).not.toBeNull()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.queryByRole('status')).toBeNull()
  })
})
