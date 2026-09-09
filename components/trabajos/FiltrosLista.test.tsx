import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FiltrosLista } from './FiltrosLista'
import type { FiltrosResueltos } from '@/lib/trabajos/consulta'

function filtros(p: Partial<FiltrosResueltos> = {}): FiltrosResueltos {
  return {
    estado: undefined,
    pago: 'cualquiera',
    periodo: 'todo',
    desde: undefined,
    hasta: undefined,
    q: undefined,
    ...p,
  }
}

const props = {
  conteoEstado: { todos: 20, en_curso: 7, cerrado: 1, entregado: 12 },
  conteoPago: { cualquiera: 20, por_cobrar: 19, pagados: 1 },
  conteoPeriodo: { todo: 20, hoy: 10, '7d': 20, '30d': 20 },
} as const

describe('FiltrosLista', () => {
  it('rotula las tres filas', () => {
    render(<FiltrosLista filtros={filtros()} {...props} />)
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Cobro')).toBeInTheDocument()
    expect(screen.getByText('Fecha de ingreso')).toBeInTheDocument()
  })

  it('muestra las pastillas de estado con su conteo', () => {
    render(<FiltrosLista filtros={filtros()} {...props} />)
    expect(screen.getByRole('link', { name: /Todos/ })).toHaveTextContent('20')
    expect(screen.getByRole('link', { name: /Entregados/ })).toHaveTextContent('12')
  })

  it('muestra las pastillas de cobro con su conteo', () => {
    render(<FiltrosLista filtros={filtros()} {...props} />)
    expect(screen.getByRole('link', { name: /Por cobrar/ })).toHaveTextContent('19')
    expect(screen.getByRole('link', { name: /Pagados/ })).toHaveTextContent('1')
  })

  // El punto del diseño de dos filas: la combinación se arma sin necesidad de
  // una pastilla dedicada para «entregados por cobrar».
  it('elegir un estado conserva el cobro elegido, y al revés', () => {
    render(<FiltrosLista filtros={filtros({ pago: 'por_cobrar' })} {...props} />)
    expect(screen.getByRole('link', { name: /Entregados/ })).toHaveAttribute(
      'href',
      '/trabajos?estado=entregado&pago=por_cobrar',
    )
  })

  it('desde una combinación, cambiar de cobro conserva el estado', () => {
    render(<FiltrosLista filtros={filtros({ estado: 'entregado', pago: 'por_cobrar' })} {...props} />)
    expect(screen.getByRole('link', { name: /Pagados/ })).toHaveAttribute(
      'href',
      '/trabajos?estado=entregado&pago=pagados',
    )
  })

  it('marca activas las pastillas de la combinación vigente', () => {
    render(<FiltrosLista filtros={filtros({ estado: 'entregado', pago: 'por_cobrar' })} {...props} />)
    expect(screen.getByRole('link', { name: /Entregados/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: /Por cobrar/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: /Cualquiera/ })).not.toHaveAttribute('aria-current')
  })

  it('«Todos» y «Cualquiera» vuelven a quitar su filtro sin tocar los otros', () => {
    render(<FiltrosLista filtros={filtros({ estado: 'entregado', pago: 'por_cobrar' })} {...props} />)
    expect(screen.getByRole('link', { name: /Todos/ })).toHaveAttribute(
      'href',
      '/trabajos?pago=por_cobrar',
    )
    expect(screen.getByRole('link', { name: /Cualquiera/ })).toHaveAttribute(
      'href',
      '/trabajos?estado=entregado',
    )
  })

  it('la fila de fecha viene incluida', () => {
    render(<FiltrosLista filtros={filtros()} {...props} />)
    expect(screen.getByRole('link', { name: /Rango/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /30 días/ })).toBeInTheDocument()
  })
})
