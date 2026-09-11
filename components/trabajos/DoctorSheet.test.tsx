import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DoctorSheet } from './DoctorSheet'

/*
  El selector de doctor con buscador.

  Existe porque MasterLab tiene 39 doctores en 21 consultorios, y un
  desplegable nativo con 39 opciones obliga a desplazar sin poder escribir.
*/

const doctores = [
  { id: '1', nombre: 'Dra. Ruiz', consultorio_nombre: 'Arte oral' },
  { id: '2', nombre: 'Dr. Muñoz', consultorio_nombre: 'Visión dental' },
  { id: '3', nombre: 'Dra. Meza', consultorio_nombre: 'Arte oral' },
]

function pintar(onElegir = vi.fn(), onCerrar = vi.fn()) {
  render(
    <DoctorSheet doctores={doctores} abierta onCerrar={onCerrar} onElegir={onElegir} />,
  )
  return { onElegir, onCerrar }
}

describe('DoctorSheet', () => {
  it('muestra todos los doctores agrupados por consultorio', () => {
    pintar()
    expect(screen.getByRole('button', { name: 'Dra. Ruiz' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Dr. Muñoz' })).toBeTruthy()
    expect(screen.getByText('Visión dental')).toBeTruthy()
  })

  it('al escribir, filtra de inmediato', async () => {
    const usuario = userEvent.setup()
    pintar()

    await usuario.type(screen.getByLabelText(/buscar doctor/i), 'ruiz')

    expect(screen.getByRole('button', { name: 'Dra. Ruiz' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Dr. Muñoz' })).toBeNull()
  })

  it('también encuentra por consultorio', async () => {
    const usuario = userEvent.setup()
    pintar()

    await usuario.type(screen.getByLabelText(/buscar doctor/i), 'arte')

    expect(screen.getByRole('button', { name: 'Dra. Ruiz' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Dra. Meza' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Dr. Muñoz' })).toBeNull()
  })

  /*
    Quien tiene prisa escribe «munoz». Exigir la eñe obligaría a buscarla en el
    teclado del teléfono, que es más lento que desplazar la lista.
  */
  it('encuentra sin escribir tildes ni eñes', async () => {
    const usuario = userEvent.setup()
    pintar()

    await usuario.type(screen.getByLabelText(/buscar doctor/i), 'munoz')

    expect(screen.getByRole('button', { name: 'Dr. Muñoz' })).toBeTruthy()
  })

  it('al elegir, avisa del doctor y cierra la hoja', async () => {
    const usuario = userEvent.setup()
    const { onElegir, onCerrar } = pintar()

    await usuario.click(screen.getByRole('button', { name: 'Dra. Meza' }))

    expect(onElegir).toHaveBeenCalledWith('3')
    expect(onCerrar).toHaveBeenCalled()
  })

  it('dice cuándo no hay coincidencias', async () => {
    const usuario = userEvent.setup()
    pintar()

    await usuario.type(screen.getByLabelText(/buscar doctor/i), 'zzz')

    expect(screen.getByText(/sin resultados/i)).toBeTruthy()
  })
})
