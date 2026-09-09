import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FiltroFecha } from './FiltroFecha'

const conteo = { todo: 18, hoy: 8, '7d': 18, '30d': 18 } as const

describe('FiltroFecha', () => {
  it('muestra las cuatro pastillas de periodo con su conteo, más «Rango…»', () => {
    render(<FiltroFecha periodo="todo" conteo={{ ...conteo }} />)
    for (const etiqueta of ['Todo', 'Hoy', '7 días', '30 días', 'Rango…']) {
      expect(screen.getByRole('link', { name: new RegExp(etiqueta) })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: /Hoy/ })).toHaveTextContent('8')
  })

  it('marca la pastilla activa', () => {
    render(<FiltroFecha periodo="hoy" conteo={{ ...conteo }} />)
    expect(screen.getByRole('link', { name: /Hoy/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Todo/ })).not.toHaveAttribute('aria-current')
  })

  it('conserva el estado y la búsqueda en cada enlace', () => {
    render(<FiltroFecha periodo="todo" conteo={{ ...conteo }} estado="en_curso" q="corona" />)
    expect(screen.getByRole('link', { name: /Hoy/ })).toHaveAttribute(
      'href',
      '/trabajos?estado=en_curso&q=corona&periodo=hoy',
    )
  })

  it('la pastilla «Todo» apunta a la ruta sin periodo', () => {
    render(<FiltroFecha periodo="hoy" conteo={{ ...conteo }} />)
    expect(screen.getByRole('link', { name: /Todo/ })).toHaveAttribute('href', '/trabajos')
  })

  it('sin el periodo de rango no aparecen los campos de fecha', () => {
    render(<FiltroFecha periodo="7d" conteo={{ ...conteo }} />)
    expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aplicar' })).not.toBeInTheDocument()
  })

  it('con el periodo de rango despliega los dos campos y el botón', () => {
    render(<FiltroFecha periodo="rango" conteo={{ ...conteo }} />)
    expect(screen.getByLabelText('Desde')).toBeInTheDocument()
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument()
  })

  it('rellena los campos con las fechas vigentes', () => {
    render(
      <FiltroFecha
        periodo="rango"
        desde="2026-09-01"
        hasta="2026-09-05"
        conteo={{ ...conteo }}
      />,
    )
    expect(screen.getByLabelText('Desde')).toHaveValue('2026-09-01')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-09-05')
  })

  // El formulario es un GET sin JavaScript: los otros filtros tienen que viajar
  // como campos ocultos o se perderían al aplicar el rango.
  it('el formulario del rango conserva estado y búsqueda en campos ocultos', () => {
    const { container } = render(
      <FiltroFecha periodo="rango" conteo={{ ...conteo }} estado="cerrado" q="ana" />,
    )
    const ocultos = [...container.querySelectorAll('input[type=hidden]')].map((i) => [
      i.getAttribute('name'),
      i.getAttribute('value'),
    ])
    expect(ocultos).toEqual([
      ['periodo', 'rango'],
      ['estado', 'cerrado'],
      ['q', 'ana'],
    ])
  })

  it('sin estado ni búsqueda no mete campos ocultos vacíos', () => {
    const { container } = render(<FiltroFecha periodo="rango" conteo={{ ...conteo }} />)
    expect(container.querySelectorAll('input[type=hidden]')).toHaveLength(1)
  })

  it('la pastilla de rango arrastra las fechas ya elegidas', () => {
    render(
      <FiltroFecha periodo="hoy" desde="2026-09-01" hasta="2026-09-05" conteo={{ ...conteo }} />,
    )
    expect(screen.getByRole('link', { name: /Rango/ })).toHaveAttribute(
      'href',
      '/trabajos?periodo=rango&desde=2026-09-01&hasta=2026-09-05',
    )
  })
})
