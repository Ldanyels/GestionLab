import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AbonoForm } from './AbonoForm'

/*
  Los atajos de monto: el arreglo a 4 abonos registrados contra 43 trabajos con
  saldo. La función existía; teclear el importe exacto sin equivocarse era la
  fricción.
*/

function campoMonto(): HTMLInputElement {
  return document.querySelector('input[name="monto"]') as HTMLInputElement
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AbonoForm — atajos de monto', () => {
  it('«Todo» llena el saldo exacto', async () => {
    const usuario = userEvent.setup()
    render(<AbonoForm trabajoId="t1" saldo={120.5} />)

    await usuario.click(screen.getByRole('button', { name: /todo/i }))

    expect(campoMonto().value).toBe('120.5')
  })

  it('«Mitad» llena la mitad', async () => {
    const usuario = userEvent.setup()
    render(<AbonoForm trabajoId="t1" saldo={120} />)

    await usuario.click(screen.getByRole('button', { name: /mitad/i }))

    expect(campoMonto().value).toBe('60')
  })

  /*
    Llenan el campo, no envían. Un pago es dinero: tiene que poder ajustarse
    antes de confirmar, y un solo toque irreversible sobre un importe es como
    se registran abonos equivocados —que fue justo el problema que hubo que
    resolver permitiendo editarlos.
  */
  it('el atajo no envía el formulario, solo llena el monto', async () => {
    const usuario = userEvent.setup()
    render(<AbonoForm trabajoId="t1" saldo={120} />)

    await usuario.click(screen.getByRole('button', { name: /todo/i }))

    expect(screen.getByRole('button', { name: /registrar abono/i })).toBeEnabled()
    expect(campoMonto().value).toBe('120')
  })

  it('un trabajo ya pagado no ofrece atajos', () => {
    render(<AbonoForm trabajoId="t1" saldo={0} />)
    expect(screen.queryByRole('button', { name: /todo/i })).toBeNull()
  })

  it('se puede escribir un monto distinto después de usar un atajo', async () => {
    const usuario = userEvent.setup()
    render(<AbonoForm trabajoId="t1" saldo={120} />)

    await usuario.click(screen.getByRole('button', { name: /todo/i }))
    await usuario.clear(campoMonto())
    await usuario.type(campoMonto(), '45')

    expect(campoMonto().value).toBe('45')
  })
})

describe('AbonoForm — sin conexión', () => {
  /*
    Un abono que parece registrado y no lo está es peor que uno sin registrar,
    porque nadie vuelve a mirarlo: el saldo queda mal y la cuenta del
    consultorio también.
  */
  it('no deja enviar sin conexión', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    render(<AbonoForm trabajoId="t1" saldo={120} />)

    const boton = screen.getByRole('button', { name: /sin conexión/i })
    expect(boton).toBeDisabled()
  })

  it('vuelve a dejar enviar cuando la conexión regresa', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    render(<AbonoForm trabajoId="t1" saldo={120} />)
    expect(screen.getByRole('button', { name: /sin conexión/i })).toBeDisabled()

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.getByRole('button', { name: /registrar abono/i })).toBeEnabled()
  })
})
