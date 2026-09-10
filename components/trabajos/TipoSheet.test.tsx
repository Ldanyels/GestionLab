import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TipoSheet } from './TipoSheet'
import type { CatalogoTrabajo } from '@/lib/catalogo/types'

function tipo(p: Partial<CatalogoTrabajo>): CatalogoTrabajo {
  return {
    id: 't1',
    laboratorio_id: 'l',
    categoria: 'Prótesis fija',
    nombre: 'Corona porcelana',
    precio_base: 90,
    variable_etiqueta: null,
    variable_precio_unitario: null,
    dias_entrega: null,
    orden: 1,
    activo: true,
    creado_en: '2026-01-01',
    ...p,
  }
}

const tipos = [
  tipo({}),
  tipo({ id: 't2', nombre: 'Perno colado', precio_base: 20 }),
  tipo({ id: 't3', categoria: 'Reparación', nombre: 'Reparación simple', precio_base: 30 }),
]

describe('TipoSheet', () => {
  it('cerrada no muestra nada', () => {
    render(<TipoSheet tipos={tipos} abierta={false} onCerrar={() => {}} onElegir={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('abierta agrupa por categoría y lista los tipos con su precio', () => {
    render(<TipoSheet tipos={tipos} abierta onCerrar={() => {}} onElegir={() => {}} />)
    expect(screen.getByText('Prótesis fija')).toBeInTheDocument()
    expect(screen.getByText('Reparación')).toBeInTheDocument()
    expect(screen.getByText('Corona porcelana')).toBeInTheDocument()
    expect(screen.getByText('S/ 90.00')).toBeInTheDocument()
  })

  it('el buscador filtra la lista', async () => {
    render(<TipoSheet tipos={tipos} abierta onCerrar={() => {}} onElegir={() => {}} />)
    await userEvent.type(screen.getByLabelText(/buscar/i), 'perno')
    expect(screen.getByText('Perno colado')).toBeInTheDocument()
    expect(screen.queryByText('Corona porcelana')).toBeNull()
  })

  it('sin resultados avisa', async () => {
    render(<TipoSheet tipos={tipos} abierta onCerrar={() => {}} onElegir={() => {}} />)
    await userEvent.type(screen.getByLabelText(/buscar/i), 'zzz')
    expect(screen.getByText(/sin resultados/i)).toBeInTheDocument()
  })

  it('al elegir avisa el id y cierra', async () => {
    const onElegir = vi.fn()
    const onCerrar = vi.fn()
    render(<TipoSheet tipos={tipos} abierta onCerrar={onCerrar} onElegir={onElegir} />)
    await userEvent.click(screen.getByRole('button', { name: /Perno colado/ }))
    expect(onElegir).toHaveBeenCalledWith('t2')
    expect(onCerrar).toHaveBeenCalledOnce()
  })

  it('marca el componente variable cuando existe', () => {
    const conVariable = [
      tipo({ id: 't4', nombre: 'Telescópica', variable_etiqueta: 'cofia', variable_precio_unitario: 20 }),
    ]
    render(<TipoSheet tipos={conVariable} abierta onCerrar={() => {}} onElegir={() => {}} />)
    expect(screen.getByText(/\+ S\/ 20\.00 \/ cofia/)).toBeInTheDocument()
  })
})
