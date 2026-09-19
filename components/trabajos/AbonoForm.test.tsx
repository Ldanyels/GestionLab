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

    expect(screen.getByRole('button', { name: /registrar adelanto/i })).toBeEnabled()
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

    expect(screen.getByRole('button', { name: /registrar adelanto/i })).toBeEnabled()
  })
})

describe('AbonoForm — el botón fuera del formulario', () => {
  /*
    El bosquejo del laboratorio pone «Cerrar trabajo» y «Registrar adelanto» en
    la misma fila. Cerrar es otra acción de servidor, o sea otro `<form>`, y un
    formulario no puede ir dentro de otro: el botón de guardar sale del suyo y
    se le asocia con `form=`.

    Eso es exactamente lo que puede romperse sin que nadie lo note —un botón
    que ya no envía nada—, así que se comprueba que sigue enviando.
  */
  it('el botón de guardar sigue enviando el formulario de abonos', async () => {
    const usuario = userEvent.setup()
    render(<AbonoForm trabajoId="t1" saldo={120} />)

    const formulario = document.getElementById('abono-t1') as HTMLFormElement
    const enviado = vi.fn((e: SubmitEvent) => e.preventDefault())
    formulario.addEventListener('submit', enviado)

    await usuario.click(screen.getByRole('button', { name: /todo/i }))
    await usuario.click(screen.getByRole('button', { name: /registrar adelanto/i }))

    expect(enviado).toHaveBeenCalledTimes(1)
  })

  it('el campo del monto pertenece a ese formulario', () => {
    render(<AbonoForm trabajoId="t1" saldo={120} />)
    expect(campoMonto().form?.id).toBe('abono-t1')
  })

  /*
    Dos trabajos abiertos a la vez —la lista y una ficha— no pueden compartir
    el id, o el botón de uno enviaría el formulario del otro.
  */
  it('cada trabajo tiene su propio id de formulario', () => {
    const { container } = render(
      <>
        <AbonoForm trabajoId="t1" saldo={10} />
        <AbonoForm trabajoId="t2" saldo={10} />
      </>,
    )
    const ids = [...container.querySelectorAll('form')].map((f) => f.id)
    expect(ids).toEqual(['abono-t1', 'abono-t2'])
  })

  it('lo que se pasa al lado se muestra junto al botón de guardar', () => {
    render(
      <AbonoForm
        trabajoId="t1"
        saldo={120}
        alLado={<button type="button">Cerrar trabajo</button>}
      />,
    )
    expect(screen.getByRole('button', { name: /cerrar trabajo/i })).toBeTruthy()
  })
})
