import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CatalogoDeLaboratorio } from './CatalogoDeLaboratorio'
import type { ItemDeCatalogo } from '@/lib/plataforma/laboratorio-detalle'

const nada = vi.fn(async () => {})
const nadaConEstado = vi.fn(async () => ({ error: '' }))

const items: ItemDeCatalogo[] = [
  { id: 'c1', categoria: 'Fija', nombre: 'Corona porcelana', precio_base: 120, activo: true },
  { id: 'c2', categoria: 'Removible', nombre: 'Prótesis total', precio_base: 400, activo: false },
]

describe('CatalogoDeLaboratorio', () => {
  it('agrupa por categoría y muestra cada tipo con su precio', () => {
    render(
      <CatalogoDeLaboratorio
        labId="l1"
        items={items}
        corregirPrecio={nada}
        crear={nadaConEstado}
      />,
    )
    expect(screen.getByText('Fija')).toBeInTheDocument()
    expect(screen.getByText('Removible')).toBeInTheDocument()
    expect(screen.getByText('Corona porcelana')).toBeInTheDocument()
  })

  it('trae el precio actual en el campo, para cambiar solo el que haga falta', () => {
    render(
      <CatalogoDeLaboratorio
        labId="l1"
        items={items}
        corregirPrecio={nada}
        crear={nadaConEstado}
      />,
    )
    expect(screen.getAllByLabelText('Precio base')[0]).toHaveValue(120)
  })

  // Un tipo archivado sigue existiendo en trabajos antiguos, así que su precio
  // también puede necesitar corrección; pero hay que poder distinguirlo.
  it('marca los tipos archivados', () => {
    render(
      <CatalogoDeLaboratorio
        labId="l1"
        items={items}
        corregirPrecio={nada}
        crear={nadaConEstado}
      />,
    )
    expect(screen.getByText('Archivado')).toBeInTheDocument()
  })

  it('avisa de que el cambio no toca los trabajos ya registrados', () => {
    render(
      <CatalogoDeLaboratorio
        labId="l1"
        items={items}
        corregirPrecio={nada}
        crear={nadaConEstado}
      />,
    )
    expect(screen.getByText(/no cambia los trabajos ya registrados/i)).toBeInTheDocument()
  })

  it('sin catálogo explica por qué importa', () => {
    render(
      <CatalogoDeLaboratorio
        labId="l1"
        items={[]}
        corregirPrecio={nada}
        crear={nadaConEstado}
      />,
    )
    expect(screen.getByText(/no puede registrar trabajos/i)).toBeInTheDocument()
  })

  it('ofrece añadir un tipo con categoría, nombre y precio', () => {
    render(
      <CatalogoDeLaboratorio
        labId="l1"
        items={items}
        corregirPrecio={nada}
        crear={nadaConEstado}
      />,
    )
    expect(screen.getByLabelText('Categoría')).toHaveAttribute('name', 'categoria')
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('name', 'nombre')
    expect(screen.getByLabelText('Precio')).toHaveAttribute('name', 'precio_base')
  })
})
