import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CorregirTrabajo } from './CorregirTrabajo'
import type { TrabajoConAbonos } from '@/lib/plataforma/laboratorio-detalle'

const nada = vi.fn(async () => {})

const datos: TrabajoConAbonos = {
  trabajo: {
    id: 't1',
    tipo_nombre: 'Corona porcelana',
    doctor_nombre: 'Dr. Pérez',
    consultorio_nombre: 'Arte oral',
    fecha_ingreso: '2026-09-01',
    entregado_el: null,
    estado: 'en_curso',
    precio_acordado: 350,
    saldo: 250,
  },
  abonos: [
    { id: 'a1', monto: 100, fecha: '2026-09-02', metodo: 'efectivo' },
  ],
}

describe('CorregirTrabajo', () => {
  it('identifica el trabajo sin nombrar al paciente', () => {
    render(<CorregirTrabajo labId="l1" datos={datos} corregir={nada} borrarAbono={nada} />)
    expect(screen.getByRole('heading', { name: 'Corona porcelana' })).toBeInTheDocument()
    expect(screen.getByText(/Arte oral · Dr. Pérez/)).toBeInTheDocument()
  })

  it('trae los valores actuales en el formulario, para no reescribirlos', () => {
    render(<CorregirTrabajo labId="l1" datos={datos} corregir={nada} borrarAbono={nada} />)
    expect(screen.getByLabelText('Precio acordado')).toHaveValue(350)
    expect(screen.getByLabelText('Estado')).toHaveValue('en_curso')
    expect(screen.getByLabelText('Fecha de ingreso')).toHaveValue('2026-09-01')
  })

  it('lista los abonos con su importe y fecha', () => {
    render(<CorregirTrabajo labId="l1" datos={datos} corregir={nada} borrarAbono={nada} />)
    expect(screen.getByText(/S\/ 100\.00/)).toBeInTheDocument()
    expect(screen.getByText(/2026-09-02/)).toBeInTheDocument()
  })

  it('permite borrar un abono, que es la corrección de un pago mal apuntado', () => {
    render(<CorregirTrabajo labId="l1" datos={datos} corregir={nada} borrarAbono={nada} />)
    expect(screen.getByRole('button', { name: 'Borrar abono' })).toBeInTheDocument()
  })

  // No se ofrece crear abonos: un pago que la plataforma inventara sería peor
  // que el error que viene a arreglar.
  it('no permite añadir abonos', () => {
    render(<CorregirTrabajo labId="l1" datos={datos} corregir={nada} borrarAbono={nada} />)
    expect(screen.queryByRole('button', { name: /añadir|registrar abono|nuevo abono/i })).toBeNull()
  })

  it('sin abonos lo dice', () => {
    render(
      <CorregirTrabajo
        labId="l1"
        datos={{ ...datos, abonos: [] }}
        corregir={nada}
        borrarAbono={nada}
      />,
    )
    expect(screen.getByText(/sin abonos/i)).toBeInTheDocument()
  })

  it('manda el laboratorio y el trabajo en el formulario', () => {
    const { container } = render(
      <CorregirTrabajo labId="l1" datos={datos} corregir={nada} borrarAbono={nada} />,
    )
    expect(container.querySelector('input[name="laboratorio_id"]')).toHaveAttribute(
      'value',
      'l1',
    )
    expect(container.querySelector('input[name="trabajo_id"]')).toHaveAttribute('value', 't1')
  })
})
