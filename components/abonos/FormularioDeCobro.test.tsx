import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormularioDeCobro } from './FormularioDeCobro'
import type { TrabajoCobrable } from '@/lib/abonos/data'

/*
  El reparto de un pago de consultorio.

  El caso real: Arte oral debe S/1.960 en 12 trabajos y yapea S/200 porque le
  pagaron dos pacientes. El consultorio es intermediario; el que paga es el
  paciente. Por eso se marca por paciente y no se reparte por antigüedad.
*/

async function accion() {
  return { error: '' }
}

function cobrable(p: Partial<TrabajoCobrable>): TrabajoCobrable {
  return {
    trabajo_id: 't1',
    paciente: 'Jeremías',
    resumen: 'Corona porcelana',
    fecha_ingreso: '2026-09-08',
    total: 90,
    pagado: 0,
    saldo: 90,
    ...p,
  }
}

const trabajos = [
  cobrable({ trabajo_id: 'a', paciente: 'Jeremías', saldo: 90 }),
  cobrable({ trabajo_id: 'b', paciente: 'Luis angel', saldo: 90 }),
  cobrable({ trabajo_id: 'c', paciente: 'Estanilao', saldo: 240 }),
]

function pintar(lista = trabajos) {
  return render(
    <FormularioDeCobro
      consultorioId="c1"
      consultorio="Arte oral"
      trabajos={lista}
      hoy="2026-09-10"
      action={accion}
    />,
  )
}

function lineasEnviadas(): { trabajo_id: string; monto: number }[] {
  const campo = document.querySelector('input[name="lineas"]') as HTMLInputElement
  return JSON.parse(campo.value)
}

describe('FormularioDeCobro', () => {
  /*
    Nada marcado al abrir. Si llegara todo marcado, un descuido registraría
    S/420 cuando el consultorio dio S/180.
  */
  it('no marca nada de entrada y no deja enviar', () => {
    pintar()
    expect(lineasEnviadas()).toEqual([])
    expect(
      screen.getByRole('button', { name: /marca los trabajos que cubre el pago/i }),
    ).toBeDisabled()
  })

  it('muestra el paciente de cada trabajo', () => {
    pintar()
    expect(screen.getByText('Jeremías')).toBeTruthy()
    expect(screen.getByText('Luis angel')).toBeTruthy()
  })

  /*
    Un trabajo sin paciente es un caso legítimo, no un dato que falta: el
    consultorio también encarga trabajos por su cuenta. Entonces manda el
    trabajo, sin ninguna etiqueta que mande a buscar un nombre que no existe.
  */
  it('sin paciente, el trabajo encabeza la fila', () => {
    pintar([cobrable({ trabajo_id: 'z', paciente: null, resumen: 'Totales acrílico' })])
    expect(screen.getByText('Totales acrílico')).toBeTruthy()
    expect(screen.queryByText(/sin paciente/i)).toBeNull()
  })

  it('al marcar, propone cobrar el trabajo entero y suma el total', async () => {
    const usuario = userEvent.setup()
    pintar()

    await usuario.click(screen.getAllByRole('checkbox')[0]!)

    expect(lineasEnviadas()).toEqual([{ trabajo_id: 'a', saldo: 90, monto: 90 }])
    expect(screen.getByRole('button', { name: /registrar pago de/i }).textContent).toContain('90')
  })

  it('marcar dos trabajos suma los dos', async () => {
    const usuario = userEvent.setup()
    pintar()

    await usuario.click(screen.getAllByRole('checkbox')[0]!)
    await usuario.click(screen.getAllByRole('checkbox')[1]!)

    expect(lineasEnviadas().map((l) => l.monto)).toEqual([90, 90])
    expect(screen.getByRole('button', { name: /registrar pago de/i }).textContent).toContain('180')
  })

  it('desmarcar lo quita del pago', async () => {
    const usuario = userEvent.setup()
    pintar()

    await usuario.click(screen.getAllByRole('checkbox')[0]!)
    await usuario.click(screen.getAllByRole('checkbox')[0]!)

    expect(lineasEnviadas()).toEqual([])
  })

  /*
    El caso de Arte oral: S/200 cubre dos trabajos completos y deja 20 sobre un
    tercero. Es el reparto que el sistema tiene que permitir expresar.
  */
  it('permite cobrar solo una parte de un trabajo', async () => {
    const usuario = userEvent.setup()
    pintar()

    await usuario.click(screen.getAllByRole('checkbox')[0]!)
    await usuario.click(screen.getAllByRole('checkbox')[1]!)
    await usuario.click(screen.getAllByRole('checkbox')[2]!)

    const campo = screen.getByLabelText(/importe para estanilao/i)
    await usuario.clear(campo)
    await usuario.type(campo, '20')

    expect(lineasEnviadas().map((l) => l.monto)).toEqual([90, 90, 20])
    expect(screen.getByRole('button', { name: /registrar pago de/i }).textContent).toContain('200')
  })

  it('muestra lo que queda pendiente de un trabajo cobrado a medias', async () => {
    const usuario = userEvent.setup()
    const { container } = pintar([cobrable({ trabajo_id: 'c', paciente: 'Estanilao', saldo: 240 })])

    await usuario.click(screen.getAllByRole('checkbox')[0]!)
    const campo = screen.getByLabelText(/importe para estanilao/i)
    await usuario.clear(campo)
    await usuario.type(campo, '20')

    expect(container.textContent).toContain('queda')
    expect(container.textContent).toContain('220')
  })

  /*
    Nadie puede cobrar más de lo que un trabajo debe. Con cada línea topada en
    su saldo, registrar un pago mayor que la deuda es imposible por
    construcción, sin comprobar el total en ningún sitio.
  */
  it('no deja cobrar más de lo que el trabajo debe', async () => {
    const usuario = userEvent.setup()
    pintar([cobrable({ trabajo_id: 'a', paciente: 'Jeremías', saldo: 90 })])

    await usuario.click(screen.getAllByRole('checkbox')[0]!)
    const campo = screen.getByLabelText(/importe para jeremías/i)
    await usuario.clear(campo)
    await usuario.type(campo, '500')

    expect(screen.getByText(/mayor que su saldo/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /registrar pago/i })).toBeDisabled()
  })

  it('dice cuánto debe el consultorio en total', () => {
    const { container } = pintar()
    expect(container.textContent).toContain('420')
    expect(container.textContent).toContain('3 trabajos')
  })
})
