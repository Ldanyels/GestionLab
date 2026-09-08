import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrabajoCard } from './TrabajoCard'
import type { TrabajoListItem } from '@/lib/trabajos/types'

function trabajo(p: Partial<TrabajoListItem> = {}): TrabajoListItem {
  return {
    id: 't1',
    laboratorio_id: 'l',
    doctor_id: 'd1',
    catalogo_trabajo_id: 'c1',
    paciente_nombre: 'Juan Díaz',
    pieza: null,
    fecha_ingreso: '2026-09-01',
    fecha_entrega: '2026-09-10',
    estado: 'en_curso',
    precio_acordado: 360,
    cantidad: 2,
    variable_cantidad: 0,
    notas: null,
    creado_en: '2026-09-01T10:00:00Z',
    doctor_nombre: 'Dr. Pérez',
    consultorio_nombre: 'Arte oral',
    tipo_nombre: '2 × Corona porcelana',
    total_pagado: 160,
    saldo: 200,
    ...p,
  }
}

describe('TrabajoCard', () => {
  it('muestra el resumen, el cliente y el estado', () => {
    render(<TrabajoCard trabajo={trabajo()} montos />)
    expect(screen.getByText('2 × Corona porcelana')).toBeInTheDocument()
    expect(screen.getByText(/Arte oral · Dr. Pérez · Juan Díaz/)).toBeInTheDocument()
    expect(screen.getByText('En curso')).toBeInTheDocument()
  })

  it('enlaza a la ficha del trabajo', () => {
    render(<TrabajoCard trabajo={trabajo()} montos />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/trabajos/t1')
  })

  it('con deuda muestra la píldora y el precio', () => {
    render(<TrabajoCard trabajo={trabajo()} montos />)
    expect(screen.getByText('Debe S/ 200.00')).toBeInTheDocument()
    expect(screen.getByText('S/ 360.00')).toBeInTheDocument()
  })

  it('sin deuda muestra Pagado', () => {
    render(<TrabajoCard trabajo={trabajo({ saldo: 0, total_pagado: 360 })} montos />)
    expect(screen.getByText('Pagado')).toBeInTheDocument()
  })

  it('sin permiso de importes oculta precio y deuda', () => {
    render(<TrabajoCard trabajo={trabajo()} montos={false} />)
    expect(screen.queryByText('S/ 360.00')).toBeNull()
    expect(screen.queryByText(/Debe/)).toBeNull()
    expect(screen.getByText('2 × Corona porcelana')).toBeInTheDocument()
  })

  it('muestra la fecha de entrega cuando existe', () => {
    render(<TrabajoCard trabajo={trabajo()} montos />)
    expect(screen.getByText(/Entrega 10\/09/)).toBeInTheDocument()
  })

  it('sin fecha de entrega no muestra esa línea', () => {
    render(<TrabajoCard trabajo={trabajo({ fecha_entrega: null })} montos />)
    expect(screen.queryByText(/Entrega/)).toBeNull()
  })
})
