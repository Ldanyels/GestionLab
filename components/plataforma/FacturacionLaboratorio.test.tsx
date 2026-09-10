import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FacturacionLaboratorio } from './FacturacionLaboratorio'
import type { FacturacionGuardada } from '@/lib/facturacion/documento'

const nada = vi.fn(async () => {})
const completos = {
  doc_tipo: 'RUC',
  doc_numero: '20512345678',
  razon_social: 'Laboratorio MasterLab E.I.R.L.',
  direccion_fiscal: 'Av. Perú 123',
}

const pintar = (datos: FacturacionGuardada = completos) =>
  render(<FacturacionLaboratorio labId="l1" datos={datos} accion={nada} />)

describe('FacturacionLaboratorio', () => {
  it('resume a quién se le emite el comprobante', () => {
    pintar()
    expect(
      screen.getByText('Laboratorio MasterLab E.I.R.L. · RUC 20512345678'),
    ).toBeInTheDocument()
  })

  /*
    Los laboratorios dados de alta antes de que existieran estos campos no los
    tienen —MasterLab entre ellos—. Si no se dijera, no habría forma de saber a
    quién no se le puede emitir una boleta.
  */
  it('avisa cuando faltan, en vez de mostrar una línea a medias', () => {
    pintar({})
    expect(screen.getByText('Sin datos de facturación')).toBeInTheDocument()
  })

  it('trae los valores actuales para corregirlos', () => {
    pintar()
    expect(screen.getByLabelText('Número')).toHaveValue('20512345678')
    expect(screen.getByLabelText('Documento')).toHaveValue('RUC')
    expect(screen.getByLabelText('Nombre o razón social')).toHaveValue(
      'Laboratorio MasterLab E.I.R.L.',
    )
  })

  // No todos los clientes tienen RUC.
  it('ofrece los tres documentos', () => {
    pintar()
    const tipos = screen.getByLabelText('Documento')
    expect(tipos).toHaveTextContent('RUC')
    expect(tipos).toHaveTextContent('DNI')
    expect(tipos).toHaveTextContent('C. extranjería')
  })

  it('manda el laboratorio en el formulario', () => {
    const { container } = pintar()
    expect(container.querySelector('input[name="laboratorio_id"]')).toHaveAttribute(
      'value',
      'l1',
    )
  })
})
