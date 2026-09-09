import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BarraFiltros } from './BarraFiltros'
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
} as const

describe('BarraFiltros — estado', () => {
  it('presenta los cuatro estados como un solo grupo, con su conteo', () => {
    render(<BarraFiltros filtros={filtros()} {...props} />)
    const grupo = screen.getByRole('group', { name: 'Estado del trabajo' })
    expect(grupo).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Entregados/ })).toHaveTextContent('12')
    expect(screen.getByRole('link', { name: /Cerrados/ })).toHaveTextContent('1')
  })

  it('«Todos» queda activo cuando no hay filtro de estado', () => {
    render(<BarraFiltros filtros={filtros()} {...props} />)
    expect(screen.getByRole('link', { name: /Todos/ })).toHaveAttribute('aria-current', 'page')
  })

  it('marca activo el estado elegido', () => {
    render(<BarraFiltros filtros={filtros({ estado: 'entregado' })} {...props} />)
    expect(screen.getByRole('link', { name: /Entregados/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: /Todos/ })).not.toHaveAttribute('aria-current')
  })
})

describe('BarraFiltros — cobro', () => {
  it('solo ofrece las dos situaciones reales, sin una tercera de «cualquiera»', () => {
    render(<BarraFiltros filtros={filtros()} {...props} />)
    expect(screen.getByRole('link', { name: /Por cobrar/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Pagados/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Cualquiera/ })).not.toBeInTheDocument()
  })

  it('muestra el conteo de cada situación', () => {
    render(<BarraFiltros filtros={filtros()} {...props} />)
    expect(screen.getByRole('link', { name: /Por cobrar/ })).toHaveTextContent('19')
  })

  // Apagado equivale a "cualquiera": así se elimina un control y una palabra
  // que además era jerga.
  it('volver a tocar la ficha activa quita el filtro de cobro', () => {
    render(<BarraFiltros filtros={filtros({ pago: 'por_cobrar' })} {...props} />)
    const activa = screen.getByRole('link', { name: /Por cobrar/ })
    expect(activa).toHaveAttribute('aria-pressed', 'true')
    expect(activa).toHaveAttribute('href', '/trabajos')
  })

  it('la ficha inactiva aplica su filtro conservando el estado', () => {
    render(<BarraFiltros filtros={filtros({ estado: 'entregado' })} {...props} />)
    expect(screen.getByRole('link', { name: /Por cobrar/ })).toHaveAttribute(
      'href',
      '/trabajos?estado=entregado&pago=por_cobrar',
    )
  })

  it('cambiar de una situación a la otra no acumula filtros', () => {
    render(<BarraFiltros filtros={filtros({ pago: 'por_cobrar' })} {...props} />)
    expect(screen.getByRole('link', { name: /Pagados/ })).toHaveAttribute(
      'href',
      '/trabajos?pago=pagados',
    )
  })
})

describe('BarraFiltros — fecha', () => {
  it('ofrece los periodos como tira de texto, sin conteos', () => {
    render(<BarraFiltros filtros={filtros()} {...props} />)
    const tira = screen.getByRole('navigation', { name: 'Fecha de ingreso' })
    for (const etiqueta of ['Todo', 'Hoy', '7 días', '30 días', 'Rango…']) {
      expect(tira).toHaveTextContent(etiqueta)
    }
    // La fecha es la dimensión secundaria: los números viven en el resumen.
    expect(tira.textContent).not.toMatch(/\d+\s*$/)
  })

  it('marca el periodo vigente', () => {
    render(<BarraFiltros filtros={filtros({ periodo: 'hoy' })} {...props} />)
    expect(screen.getByRole('link', { name: 'Hoy' })).toHaveAttribute('aria-current', 'page')
  })

  it('conserva estado y cobro al cambiar de periodo', () => {
    render(
      <BarraFiltros filtros={filtros({ estado: 'entregado', pago: 'por_cobrar' })} {...props} />,
    )
    expect(screen.getByRole('link', { name: 'Hoy' })).toHaveAttribute(
      'href',
      '/trabajos?estado=entregado&pago=por_cobrar&periodo=hoy',
    )
  })

  it('sin el periodo de rango no aparecen los campos de fecha', () => {
    render(<BarraFiltros filtros={filtros()} {...props} />)
    expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument()
  })

  it('con el periodo de rango despliega los campos y el botón', () => {
    render(<BarraFiltros filtros={filtros({ periodo: 'rango' })} {...props} />)
    expect(screen.getByLabelText('Desde')).toBeInTheDocument()
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument()
  })

  it('el formulario del rango conserva los otros filtros en campos ocultos', () => {
    const { container } = render(
      <BarraFiltros
        filtros={filtros({ periodo: 'rango', estado: 'cerrado', pago: 'pagados', q: 'ana' })}
        {...props}
      />,
    )
    const ocultos = [...container.querySelectorAll('input[type=hidden]')].map((i) => [
      i.getAttribute('name'),
      i.getAttribute('value'),
    ])
    expect(ocultos).toEqual([
      ['periodo', 'rango'],
      ['estado', 'cerrado'],
      ['pago', 'pagados'],
      ['q', 'ana'],
    ])
  })
})

describe('BarraFiltros — sin rótulos', () => {
  // Defecto que el cliente señaló: tres rótulos en mayúsculas hacían que cada
  // fila pareciera un aparato suelto. Los controles se nombran solos.
  it('no imprime rótulos de sección en la pantalla', () => {
    render(<BarraFiltros filtros={filtros()} {...props} />)
    expect(screen.queryByText('ESTADO')).not.toBeInTheDocument()
    expect(screen.queryByText('COBRO')).not.toBeInTheDocument()
    expect(screen.queryByText('FECHA DE INGRESO')).not.toBeInTheDocument()
    expect(screen.queryByText('Estado')).not.toBeInTheDocument()
  })

  it('pero sí los expone a lectores de pantalla', () => {
    render(<BarraFiltros filtros={filtros()} {...props} />)
    expect(screen.getByRole('group', { name: 'Estado del trabajo' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Situación de cobro' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Fecha de ingreso' })).toBeInTheDocument()
  })
})
