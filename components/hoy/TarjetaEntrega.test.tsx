import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TarjetaEntrega } from './TarjetaEntrega'
import type { TrabajoListItem } from '@/lib/trabajos/types'

function trabajo(p: Partial<TrabajoListItem> = {}): TrabajoListItem {
  return {
    id: 't1',
    laboratorio_id: 'l',
    doctor_id: 'd',
    catalogo_trabajo_id: 'c',
    paciente_nombre: 'Ana Torres',
    pieza: null,
    fecha_ingreso: '2026-09-01',
    fecha_entrega: '2026-09-08',
    entregado_el: null,
    estado: 'en_curso',
    precio_acordado: 90,
    cantidad: 1,
    variable_cantidad: 0,
    notas: null,
    creado_en: '2026-09-01T10:00:00Z',
    doctor_nombre: 'Iván',
    consultorio_nombre: 'Arte oral',
    tipo_nombre: 'Corona porcelana',
    total_pagado: 0,
    saldo: 90,
    ...p,
  }
}

describe('TarjetaEntrega', () => {
  it('muestra el tipo de trabajo, el consultorio, el doctor y el paciente', () => {
    render(<TarjetaEntrega trabajo={trabajo()} montos={false} />)
    expect(screen.getByText('Corona porcelana')).toBeInTheDocument()
    expect(screen.getByText(/Arte oral · Iván · Ana Torres/)).toBeInTheDocument()
  })

  it('enlaza a la ficha del trabajo', () => {
    render(<TarjetaEntrega trabajo={trabajo({ id: 'abc' })} montos={false} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/trabajos/abc')
  })

  it('omite el paciente cuando no hay', () => {
    render(<TarjetaEntrega trabajo={trabajo({ paciente_nombre: null })} montos={false} />)
    expect(screen.getByText('Arte oral · Iván')).toBeInTheDocument()
  })

  it('muestra el importe solo a quien ve montos', () => {
    render(<TarjetaEntrega trabajo={trabajo()} montos />)
    expect(screen.getByText(/90/)).toBeInTheDocument()
  })

  it('no muestra importe al técnico', () => {
    render(<TarjetaEntrega trabajo={trabajo()} montos={false} />)
    expect(screen.queryByText(/S\//)).not.toBeInTheDocument()
  })

  it('sin conEstado no muestra el chip de estado', () => {
    render(<TarjetaEntrega trabajo={trabajo({ estado: 'entregado' })} montos={false} />)
    expect(screen.queryByText('Entregado')).not.toBeInTheDocument()
  })

  it('con conEstado etiqueta un trabajo entregado', () => {
    render(<TarjetaEntrega trabajo={trabajo({ estado: 'entregado' })} montos={false} conEstado />)
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('con conEstado etiqueta un trabajo cerrado', () => {
    render(<TarjetaEntrega trabajo={trabajo({ estado: 'cerrado' })} montos={false} conEstado />)
    expect(screen.getByText('Cerrado')).toBeInTheDocument()
  })

  it('el técnico ve el estado aunque no vea importes: es su producción del día', () => {
    render(<TarjetaEntrega trabajo={trabajo({ estado: 'cerrado' })} montos={false} conEstado />)
    expect(screen.getByText('Cerrado')).toBeInTheDocument()
    expect(screen.queryByText(/S\//)).not.toBeInTheDocument()
  })
})

describe('TarjetaEntrega — fechas del trabajo', () => {
  /*
    La fecha de ingreso siempre: dice cuánto lleva la pieza en el taller, que
    es la pregunta que se hace al mirar la pantalla por la mañana.
  */
  it('siempre muestra cuándo ingresó', () => {
    const { container } = render(
      <TarjetaEntrega trabajo={trabajo({ fecha_ingreso: '2026-09-01' })} montos />,
    )
    expect(container.textContent).toContain('Ingresó 01/09')
  })

  it('muestra la fecha de entrega cuando se le puso una', () => {
    const { container } = render(
      <TarjetaEntrega trabajo={trabajo({ fecha_entrega: '2026-09-08' })} montos />,
    )
    expect(container.textContent).toContain('Entrega 08/09')
  })

  /*
    La mitad de los trabajos no llevan fecha de entrega. Escribir «Entrega —»
    en todos ellos gastaría la línea en decir que no hay dato.
  */
  it('sin fecha de entrega no escribe nada de entrega', () => {
    const { container } = render(
      <TarjetaEntrega trabajo={trabajo({ fecha_entrega: null })} montos />,
    )
    expect(container.textContent).toContain('Ingresó')
    expect(container.textContent).not.toContain('Entrega')
  })

  it('marca «Atrasada» cuando la fecha ya pasó', () => {
    const { container } = render(
      <TarjetaEntrega
        trabajo={trabajo({ fecha_entrega: '2026-09-08', estado: 'en_curso' })}
        montos
        hoy="2026-09-17"
      />,
    )
    expect(container.textContent).toContain('Atrasada 08/09')
  })

  it('una entrega futura no se marca', () => {
    const { container } = render(
      <TarjetaEntrega
        trabajo={trabajo({ fecha_entrega: '2026-09-25', estado: 'en_curso' })}
        montos
        hoy="2026-09-17"
      />,
    )
    expect(container.textContent).toContain('Entrega 25/09')
    expect(container.textContent).not.toContain('Atrasada')
  })

  /*
    En un entregado manda la fecha real de salida, no la prometida: la promesa
    ya no informa de nada cuando el trabajo salió, y tener las dos a la vez
    invita a leer una por la otra.
  */
  it('en un entregado muestra la fecha real de salida', () => {
    const { container } = render(
      <TarjetaEntrega
        trabajo={trabajo({
          estado: 'entregado',
          fecha_entrega: '2026-09-08',
          entregado_el: '2026-09-10',
        })}
        montos
        hoy="2026-09-17"
      />,
    )
    expect(container.textContent).toContain('Entregado 10/09')
    expect(container.textContent).not.toContain('Atrasada')
  })

  /*
    Sin `hoy` no se marca atraso: calcularlo con el reloj del dispositivo
    marcaría vencido, en otra zona horaria, algo que vence hoy.
  */
  it('sin la fecha de hoy no marca atraso', () => {
    const { container } = render(
      <TarjetaEntrega trabajo={trabajo({ fecha_entrega: '2026-09-08' })} montos />,
    )
    expect(container.textContent).not.toContain('Atrasada')
  })
})

describe('TarjetaEntrega — qué ve un técnico sin permiso de importes', () => {
  /*
    Las fechas no son un dato financiero.

    Lo que el permiso `reportes_montos` oculta es el **precio**: cuánto cobra
    el laboratorio por ese trabajo. Cuándo entró la pieza y para cuándo está
    prometida es justo lo que el técnico necesita para organizar su día, y
    esconderlo le dejaría la pantalla sin la información con la que trabaja.

    Esta prueba existe para que nadie las meta detrás de `montos` por descuido
    al tocar la tarjeta.
  */
  it('sigue viendo las dos fechas', () => {
    const { container } = render(
      <TarjetaEntrega
        trabajo={trabajo({ fecha_ingreso: '2026-09-14', fecha_entrega: '2026-09-20' })}
        montos={false}
        hoy="2026-09-17"
      />,
    )
    expect(container.textContent).toContain('Ingresó 14/09')
    expect(container.textContent).toContain('Entrega 20/09')
  })

  it('sigue viendo el aviso de atraso', () => {
    const { container } = render(
      <TarjetaEntrega
        trabajo={trabajo({ fecha_entrega: '2026-09-08', estado: 'en_curso' })}
        montos={false}
        hoy="2026-09-17"
      />,
    )
    expect(container.textContent).toContain('Atrasada 08/09')
  })

  it('pero no el precio', () => {
    const { container } = render(
      <TarjetaEntrega trabajo={trabajo({ precio_acordado: 90 })} montos={false} />,
    )
    expect(container.textContent).not.toContain('90')
  })

  it('y el administrador sí ve el precio', () => {
    const { container } = render(
      <TarjetaEntrega trabajo={trabajo({ precio_acordado: 90 })} montos />,
    )
    expect(container.textContent).toContain('90')
  })
})
