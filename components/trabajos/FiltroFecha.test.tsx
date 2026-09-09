import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FiltroFecha } from './FiltroFecha'
import type { FiltrosResueltos } from '@/lib/trabajos/consulta'

const conteo = { todo: 20, hoy: 10, '7d': 20, '30d': 20 } as const

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

describe('FiltroFecha', () => {
  it('muestra las cuatro pastillas de periodo con su conteo, más «Rango…»', () => {
    render(<FiltroFecha filtros={filtros()} conteo={{ ...conteo }} />)
    for (const etiqueta of ['Todo', 'Hoy', '7 días', '30 días', 'Rango…']) {
      expect(screen.getByRole('link', { name: new RegExp(etiqueta) })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: /Hoy/ })).toHaveTextContent('10')
  })

  it('marca la pastilla activa', () => {
    render(<FiltroFecha filtros={filtros({ periodo: 'hoy' })} conteo={{ ...conteo }} />)
    expect(screen.getByRole('link', { name: /Hoy/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Todo/ })).not.toHaveAttribute('aria-current')
  })

  it('conserva estado, cobro y búsqueda en cada enlace', () => {
    render(
      <FiltroFecha
        filtros={filtros({ estado: 'entregado', pago: 'por_cobrar', q: 'corona' })}
        conteo={{ ...conteo }}
      />,
    )
    expect(screen.getByRole('link', { name: /Hoy/ })).toHaveAttribute(
      'href',
      '/trabajos?estado=entregado&pago=por_cobrar&q=corona&periodo=hoy',
    )
  })

  it('la pastilla «Todo» apunta a la ruta sin periodo', () => {
    render(<FiltroFecha filtros={filtros({ periodo: 'hoy' })} conteo={{ ...conteo }} />)
    expect(screen.getByRole('link', { name: /Todo/ })).toHaveAttribute('href', '/trabajos')
  })

  it('sin el periodo de rango no aparecen los campos de fecha', () => {
    render(<FiltroFecha filtros={filtros({ periodo: '7d' })} conteo={{ ...conteo }} />)
    expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aplicar' })).not.toBeInTheDocument()
  })

  it('con el periodo de rango despliega los dos campos y el botón', () => {
    render(<FiltroFecha filtros={filtros({ periodo: 'rango' })} conteo={{ ...conteo }} />)
    expect(screen.getByLabelText('Desde')).toBeInTheDocument()
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument()
  })

  it('rellena los campos con las fechas vigentes', () => {
    render(
      <FiltroFecha
        filtros={filtros({ periodo: 'rango', desde: '2026-09-01', hasta: '2026-09-05' })}
        conteo={{ ...conteo }}
      />,
    )
    expect(screen.getByLabelText('Desde')).toHaveValue('2026-09-01')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-09-05')
  })

  // El formulario es un GET sin JavaScript: los otros filtros tienen que viajar
  // como campos ocultos o se perderían al aplicar el rango.
  it('el formulario del rango conserva los otros filtros en campos ocultos', () => {
    const { container } = render(
      <FiltroFecha
        filtros={filtros({ periodo: 'rango', estado: 'cerrado', pago: 'pagados', q: 'ana' })}
        conteo={{ ...conteo }}
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

  it('no mete campos ocultos para los valores por defecto', () => {
    const { container } = render(
      <FiltroFecha filtros={filtros({ periodo: 'rango' })} conteo={{ ...conteo }} />,
    )
    expect(container.querySelectorAll('input[type=hidden]')).toHaveLength(1)
  })
})
