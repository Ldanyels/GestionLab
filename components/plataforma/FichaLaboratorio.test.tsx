import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FichaLaboratorio } from './FichaLaboratorio'
import type { TrabajoDePlataforma } from '@/lib/plataforma/laboratorio-detalle'

const resumen = {
  laboratorio: {
    id: 'l1',
    nombre: 'MasterLab',
    plan: 'gratis' as const,
    estado: 'activo' as const,
    creado_en: '2026-07-15T00:00:00Z',
    usuarios: 4,
    trabajos: 29,
  },
  consultorios: 3,
  doctores: 7,
}

const trabajo = (p: Partial<TrabajoDePlataforma> = {}): TrabajoDePlataforma => ({
  id: 't1',
  tipo_nombre: 'Corona porcelana',
  doctor_nombre: 'Dr. Pérez',
  consultorio_nombre: 'Arte oral',
  fecha_ingreso: '2026-09-01',
  entregado_el: null,
  estado: 'en_curso',
  precio_acordado: 360,
  saldo: 200,
  ...p,
})

describe('FichaLaboratorio', () => {
  it('encabeza con el nombre del laboratorio y sus cifras', () => {
    render(<FichaLaboratorio resumen={resumen} trabajos={[trabajo()]} />)
    expect(screen.getByRole('heading', { name: 'MasterLab' })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('lista los trabajos por tipo, doctor y consultorio', () => {
    render(<FichaLaboratorio resumen={resumen} trabajos={[trabajo()]} />)
    expect(screen.getByText('Corona porcelana')).toBeInTheDocument()
    expect(screen.getByText(/Arte oral · Dr. Pérez/)).toBeInTheDocument()
  })

  it('avisa cuando el laboratorio está suspendido', () => {
    render(
      <FichaLaboratorio
        resumen={{ ...resumen, laboratorio: { ...resumen.laboratorio, estado: 'suspendido' } }}
        trabajos={[]}
      />,
    )
    expect(screen.getByText('Suspendido')).toBeInTheDocument()
  })

  it('dice que no hay trabajos en vez de mostrar una lista vacía', () => {
    render(<FichaLaboratorio resumen={resumen} trabajos={[]} />)
    expect(screen.getByText(/no ha registrado trabajos/i)).toBeInTheDocument()
  })
})
