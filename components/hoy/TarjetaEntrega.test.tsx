import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TarjetaEntrega } from './TarjetaEntrega'
import type { TrabajoListItem } from '@/lib/trabajos/types'

function trabajo(p: Partial<TrabajoListItem> = {}): TrabajoListItem {
  return {
    id: 't1',
    laboratorio_id: 'l',
    doctor_id: 'd',
    catalogo_trabajo_id: 'c',
    paciente_nombre: 'Ana Torres',
    pieza: null,
    fecha_ingreso: '2026-09-01',
    fecha_entrega: '2026-09-08',
    entregado_el: null,
    estado: 'en_curso',
    precio_acordado: 90,
    cantidad: 1,
    variable_cantidad: 0,
    notas: null,
    creado_en: '2026-09-01T10:00:00Z',
    doctor_nombre: 'Iván',
    consultorio_nombre: 'Arte oral',
    tipo_nombre: 'Corona porcelana',
    total_pagado: 0,
    saldo: 90,
    ...p,
  }
}

describe('TarjetaEntrega', () => {
  it('muestra el tipo de trabajo, el consultorio, el doctor y el paciente', () => {
    render(<TarjetaEntrega trabajo={trabajo()} montos={false} />)
    expect(screen.getByText('Corona porcelana')).toBeInTheDocument()
    expect(screen.getByText(/Arte oral · Iván · Ana Torres/)).toBeInTheDocument()
  })

  it('enlaza a la ficha del trabajo', () => {
    render(<TarjetaEntrega trabajo={trabajo({ id: 'abc' })} montos={false} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/trabajos/abc')
  })

  it('omite el paciente cuando no hay', () => {
    render(<TarjetaEntrega trabajo={trabajo({ paciente_nombre: null })} montos={false} />)
    expect(screen.getByText('Arte oral · Iván')).toBeInTheDocument()
  })

  it('muestra el importe solo a quien ve montos', () => {
    render(<TarjetaEntrega trabajo={trabajo()} montos />)
    expect(screen.getByText(/90/)).toBeInTheDocument()
  })

  it('no muestra importe al técnico', () => {
    render(<TarjetaEntrega trabajo={trabajo()} montos={false} />)
    expect(screen.queryByText(/S\//)).not.toBeInTheDocument()
  })

  it('sin conEstado no muestra el chip de estado', () => {
    render(<TarjetaEntrega trabajo={trabajo({ estado: 'entregado' })} montos={false} />)
    expect(screen.queryByText('Entregado')).not.toBeInTheDocument()
  })

  it('con conEstado etiqueta un trabajo entregado', () => {
    render(<TarjetaEntrega trabajo={trabajo({ estado: 'entregado' })} montos={false} conEstado />)
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('con conEstado etiqueta un trabajo cerrado', () => {
    render(<TarjetaEntrega trabajo={trabajo({ estado: 'cerrado' })} montos={false} conEstado />)
    expect(screen.getByText('Cerrado')).toBeInTheDocument()
  })

  it('el técnico ve el estado aunque no vea importes: es su producción del día', () => {
    render(<TarjetaEntrega trabajo={trabajo({ estado: 'cerrado' })} montos={false} conEstado />)
    expect(screen.getByText('Cerrado')).toBeInTheDocument()
    expect(screen.queryByText(/S\//)).not.toBeInTheDocument()
  })
})
