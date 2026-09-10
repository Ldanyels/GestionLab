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
    entregado_el: null,
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

  // La fecha real manda sobre la prometida: es la que consta, y en el resto de
  // la aplicación la prometida está casi siempre vacía.
  it('entregado muestra la fecha real, no la prometida', () => {
    render(
      <TrabajoCard
        trabajo={trabajo({ estado: 'entregado', entregado_el: '2026-09-12' })}
        montos
      />,
    )
    expect(screen.getByText(/Entregado 12\/09/)).toBeInTheDocument()
    expect(screen.queryByText(/Entrega 10\/09/)).toBeNull()
  })

  // Los entregados de antes de la migración 0019. Prometer una fecha que no
  // consta sería peor que no mostrar ninguna.
  it('entregado sin fecha real no muestra ninguna fecha', () => {
    render(
      <TrabajoCard trabajo={trabajo({ estado: 'entregado', entregado_el: null })} montos />,
    )
    // Con el día incluido en el patrón: un `/Entrega/` suelto coincidiría con
    // la insignia de estado, que en un entregado dice justamente «Entregado».
    expect(screen.queryByText(/Entregad?o? \d\d\/\d\d/)).toBeNull()
  })
})

describe('TrabajoCard — atraso', () => {
  /*
    La lista de trabajos es donde el técnico decide qué hacer a continuación, y
    una fecha pasada en gris no se distingue de una futura. Estas pruebas fijan
    que el atraso se vea ahí, no solo en la pantalla Hoy.
  */
  it('marca «Atrasada» cuando la fecha pasó y sigue en curso', () => {
    const { container } = render(
      <TrabajoCard
        trabajo={trabajo({ fecha_entrega: '2026-09-05', estado: 'en_curso' })}
        montos
        hoy="2026-09-10"
      />,
    )
    expect(container.textContent).toContain('Atrasada')
  })

  it('no marca nada si la fecha aún no llegó', () => {
    const { container } = render(
      <TrabajoCard
        trabajo={trabajo({ fecha_entrega: '2026-09-20', estado: 'en_curso' })}
        montos
        hoy="2026-09-10"
      />,
    )
    expect(container.textContent).not.toContain('Atrasada')
    expect(container.textContent).toContain('Entrega')
  })

  it('un entregado no está atrasado aunque su fecha haya pasado', () => {
    const { container } = render(
      <TrabajoCard
        trabajo={{
          ...trabajo({ fecha_entrega: '2026-08-01', estado: 'entregado' }),
          entregado_el: '2026-08-03',
        }}
        montos
        hoy="2026-09-10"
      />,
    )
    expect(container.textContent).not.toContain('Atrasada')
    expect(container.textContent).toContain('Entregado')
  })

  /*
    Sin `hoy` la tarjeta no marca nada. Calcularlo con el reloj del dispositivo
    marcaría atrasado, en otra zona horaria, un trabajo que vence hoy.
  */
  it('sin la fecha de hoy no marca atraso', () => {
    const { container } = render(
      <TrabajoCard
        trabajo={trabajo({ fecha_entrega: '2026-09-05', estado: 'en_curso' })}
        montos
      />,
    )
    expect(container.textContent).not.toContain('Atrasada')
  })
})
