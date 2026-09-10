import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AbonoEditable } from './AbonoEditable'
import type { Abono } from '@/lib/abonos/types'

const abono = (p: Partial<Abono> = {}): Abono => ({
  id: 'a1',
  laboratorio_id: 'l1',
  trabajo_id: 't1',
  monto: 150,
  fecha: '2026-09-01',
  metodo: 'efectivo',
  nota: null,
  creado_en: '2026-09-01T10:00:00Z',
  ...p,
})

const pintar = (puedeEditar = true) =>
  render(<AbonoEditable abono={abono()} trabajoId="t1" puedeEditar={puedeEditar} />)

describe('AbonoEditable', () => {
  it('muestra el abono con su monto, fecha y método', () => {
    pintar()
    expect(screen.getByText('S/ 150.00')).toBeInTheDocument()
    expect(screen.getByText(/2026-09-01 · efectivo/)).toBeInTheDocument()
  })

  // Tres campos abiertos por abono convertirían la lista en un muro de casillas.
  it('el formulario nace cerrado', () => {
    pintar()
    expect(screen.queryByLabelText('Monto')).toBeNull()
    expect(screen.getByRole('button', { name: 'Corregir' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('al tocar Corregir aparece con los valores actuales', async () => {
    pintar()
    await userEvent.click(screen.getByRole('button', { name: 'Corregir' }))
    expect(screen.getByLabelText('Monto')).toHaveValue(150)
    expect(screen.getByLabelText('Fecha')).toHaveValue('2026-09-01')
    expect(screen.getByLabelText('Método')).toHaveValue('efectivo')
  })

  it('se puede cerrar sin guardar', async () => {
    pintar()
    await userEvent.click(screen.getByRole('button', { name: 'Corregir' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByLabelText('Monto')).toBeNull()
  })

  it('manda el abono y el trabajo en el envío', async () => {
    const { container } = pintar()
    await userEvent.click(screen.getByRole('button', { name: 'Corregir' }))
    expect(container.querySelector('input[name="id"]')).toHaveAttribute('value', 'a1')
    expect(container.querySelector('input[name="trabajo_id"]')).toHaveAttribute('value', 't1')
  })

  /*
    Avisar de que queda registrado no es una amenaza: es lo que hace aceptable
    que un abono se pueda editar.
  */
  it('avisa de que el monto anterior queda en el historial', async () => {
    pintar()
    await userEvent.click(screen.getByRole('button', { name: 'Corregir' }))
    expect(screen.getByText(/queda en el historial/i)).toBeInTheDocument()
  })

  it('sin permiso no ofrece corregir', () => {
    pintar(false)
    expect(screen.queryByRole('button', { name: 'Corregir' })).toBeNull()
    expect(screen.getByText('S/ 150.00')).toBeInTheDocument()
  })
})
