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

    expect(screen.getByRole('button', { name: /^adelanto$/i })).toBeEnabled()
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

    expect(screen.getByRole('button', { name: /^adelanto$/i })).toBeEnabled()
  })
})

describe('AbonoForm — cerrar cobrando', () => {
  /*
    El final normal de un trabajo: el consultorio recoge la pieza y paga lo que
    falta en el mismo gesto. Un solo botón registra el importe y cierra, porque
    obligar a dos envíos es justo donde se perdian los cobros.
  */
  it('«Trabajo cerrado» envía el formulario marcando que hay que cerrar', async () => {
    const usuario = userEvent.setup()
    render(<AbonoForm trabajoId="t1" saldo={260} puedeCerrar />)

    const boton = screen.getByRole('button', { name: /trabajo cerrado/i })
    expect(boton.getAttribute('name')).toBe('cerrar')
    expect(boton.getAttribute('value')).toBe('1')

    await usuario.click(screen.getByRole('button', { name: /todo/i }))
    expect(campoMonto().value).toBe('260')
  })

  /*
    También se cierra un trabajo ya pagado, o uno cobrado por fuera: sin
    `formNoValidate` el navegador exigiría el monto y no dejaría cerrar.
  */
  /*
    Que el botón lleve `name`/`value` no basta: solo viaja si el navegador lo
    reconoce como el que envió. Se comprueba con el `FormData` real que se
    construye a partir del enviador, que es lo que recibe la acción.
  */
  it('el envío lleva cerrar=1 y el monto escrito', async () => {
    const usuario = userEvent.setup()
    render(<AbonoForm trabajoId="t1" saldo={260} puedeCerrar />)

    const formulario = document.querySelector('form') as HTMLFormElement
    let datos: FormData | null = null
    formulario.addEventListener('submit', (e) => {
      e.preventDefault()
      datos = new FormData(formulario, (e as SubmitEvent).submitter)
    })

    await usuario.click(screen.getByRole('button', { name: /todo/i }))
    await usuario.click(screen.getByRole('button', { name: /trabajo cerrado/i }))

    expect(datos!.get('cerrar')).toBe('1')
    expect(datos!.get('monto')).toBe('260')
    expect(datos!.get('trabajo_id')).toBe('t1')
  })

  it('el envío con «Adelanto» no lleva cerrar', async () => {
    const usuario = userEvent.setup()
    render(<AbonoForm trabajoId="t1" saldo={260} puedeCerrar />)

    const formulario = document.querySelector('form') as HTMLFormElement
    let datos: FormData | null = null
    formulario.addEventListener('submit', (e) => {
      e.preventDefault()
      datos = new FormData(formulario, (e as SubmitEvent).submitter)
    })

    await usuario.click(screen.getByRole('button', { name: /todo/i }))
    await usuario.click(screen.getByRole('button', { name: /^adelanto$/i }))

    expect(datos!.get('cerrar')).toBeNull()
    expect(datos!.get('monto')).toBe('260')
  })

  it('«Trabajo cerrado» no exige el monto', () => {
    render(<AbonoForm trabajoId="t1" saldo={260} puedeCerrar />)
    expect(
      screen.getByRole('button', { name: /trabajo cerrado/i }).hasAttribute('formnovalidate'),
    ).toBe(true)
  })

  it('«Adelanto» no lleva la marca de cerrar', () => {
    render(<AbonoForm trabajoId="t1" saldo={260} puedeCerrar />)
    expect(screen.getByRole('button', { name: /^adelanto$/i }).getAttribute('name')).toBeNull()
  })

  it('en un trabajo ya cerrado no se ofrece volver a cerrarlo', () => {
    render(<AbonoForm trabajoId="t1" saldo={260} />)
    expect(screen.queryByRole('button', { name: /trabajo cerrado/i })).toBeNull()
    expect(screen.getByRole('button', { name: /^adelanto$/i })).toBeTruthy()
  })

  it('la nota sigue estando, plegada', () => {
    render(<AbonoForm trabajoId="t1" saldo={260} puedeCerrar />)
    expect(document.querySelector('input[name="nota"]')).toBeTruthy()
  })
})
