import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FilaLaboratorio } from './FilaLaboratorio'
import type { LaboratorioFila } from '@/lib/plataforma/laboratorios'

vi.mock('@/app/(plataforma)/plataforma/actions', () => ({
  cambiarEstadoAction: vi.fn(),
}))

function lab(p: Partial<LaboratorioFila> = {}): LaboratorioFila {
  return {
    id: 'l1',
    nombre: 'MasterLab',
    plan: 'gratis',
    estado: 'activo',
    creado_en: '2026-07-13T10:00:00Z',
    usuarios: 4,
    trabajos: 20,
    ...p,
  }
}

describe('FilaLaboratorio', () => {
  it('muestra el nombre y el recuento de usuarios y trabajos', () => {
    render(<FilaLaboratorio lab={lab()} />)
    expect(screen.getByText('MasterLab')).toBeInTheDocument()
    expect(screen.getByText(/4 usuarios/)).toBeInTheDocument()
    expect(screen.getByText(/20 trabajos/)).toBeInTheDocument()
  })

  it('usa el singular cuando corresponde', () => {
    render(<FilaLaboratorio lab={lab({ usuarios: 1, trabajos: 1 })} />)
    expect(screen.getByText(/1 usuario ·/)).toBeInTheDocument()
    expect(screen.getByText(/1 trabajo\s*$/)).toBeInTheDocument()
  })

  it('a un laboratorio activo le ofrece suspender', () => {
    render(<FilaLaboratorio lab={lab({ estado: 'activo' })} />)
    expect(screen.getByRole('button', { name: /suspender/i })).toBeInTheDocument()
  })

  it('a un laboratorio suspendido lo marca y le ofrece reactivar', () => {
    render(<FilaLaboratorio lab={lab({ estado: 'suspendido' })} />)
    expect(screen.getByText('Suspendido')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reactivar/i })).toBeInTheDocument()
  })

  it('distingue el plan de cortesía del pagado', () => {
    render(<FilaLaboratorio lab={lab({ plan: 'gratis' })} />)
    expect(screen.getByText('Cortesía')).toBeInTheDocument()
  })

  it('manda el id y el estado destino en campos ocultos', () => {
    const { container } = render(<FilaLaboratorio lab={lab({ estado: 'activo' })} />)
    expect(container.querySelector('input[name=id]')).toHaveAttribute('value', 'l1')
    expect(container.querySelector('input[name=estado]')).toHaveAttribute(
      'value',
      'suspendido',
    )
  })

  // El destino es el contrario del estado actual: si no, el botón de reactivar
  // volvería a suspender.
  it('el estado destino de uno suspendido es activo', () => {
    const { container } = render(<FilaLaboratorio lab={lab({ estado: 'suspendido' })} />)
    expect(container.querySelector('input[name=estado]')).toHaveAttribute('value', 'activo')
  })
})
