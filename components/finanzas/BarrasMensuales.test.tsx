import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BarrasMensuales } from './BarrasMensuales'

const SEP = { mes: '2026-09-01', ingresos: 14360, gastos: 5120 }
const OCT = { mes: '2026-10-01', ingresos: 18190, gastos: 2260 }
const VACIO = { mes: '2026-08-01', ingresos: 0, gastos: 0 }

function barras(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[title^="Ingresos"], [title^="Gastos"]')]
}

describe('BarrasMensuales', () => {
  it('sin datos lo dice', () => {
    render(<BarrasMensuales datos={[]} />)
    expect(screen.getByText(/sin movimientos/i)).toBeTruthy()
  })

  it('pinta una barra de ingresos y otra de gastos por mes', () => {
    const { container } = render(<BarrasMensuales datos={[SEP, OCT]} />)
    expect(barras(container)).toHaveLength(4)
    expect(screen.getByText('set')).toBeTruthy()
    expect(screen.getByText('oct')).toBeTruthy()
  })

  it('la barra más alta de la serie llega al 100 %', () => {
    const { container } = render(<BarrasMensuales datos={[SEP, OCT]} />)
    const alturas = barras(container).map((b) => b.style.height)
    expect(alturas).toContain('100%')
  })

  it('las demás van en proporción', () => {
    const { container } = render(<BarrasMensuales datos={[SEP, OCT]} />)
    // 14360 de 18190 = 78.9 %
    expect(barras(container)[0]!.style.height).toBe('78.9%')
  })

  it('un mes sin movimientos no levanta barra', () => {
    const { container } = render(<BarrasMensuales datos={[VACIO, OCT]} />)
    expect(barras(container)[0]!.style.height).toBe('0%')
  })

  /*
    El fallo que tuvo esta tarjeta durante meses.

    La fila era `items-end`, así que la columna de cada mes no se estiraba:
    medía lo que su contenido —23 px, solo la etiqueta— y el `h-full` de la
    zona de barras se resolvía contra una altura automática. Las barras, en
    porcentaje de eso, salían de 0 px. Medido en el navegador: la tarjeta no
    llegó a pintar una sola barra.

    Jsdom no calcula el diseño, así que lo que se fija aquí es la estructura
    que lo hace posible: la fila no fuerza el final, y la zona de barras toma
    el espacio con `flex-1`.
  */
  it('la columna se estira y la zona de barras toma el resto', () => {
    const { container } = render(<BarrasMensuales datos={[SEP]} />)
    const fila = container.querySelector<HTMLElement>('.h-\\[170px\\]')!
    expect(fila.className.split(/\s+/)).not.toContain('items-end')

    const zonaBarras = fila.firstElementChild!.firstElementChild as HTMLElement
    const clases = zonaBarras.className.split(/\s+/)
    expect(clases).toContain('flex-1')
    // Sin `min-h-0` un hijo flex no baja de su contenido y `flex-1` no manda.
    expect(clases).toContain('min-h-0')
    // El `h-full` de antes resolvía contra una altura automática: 0 px.
    expect(clases).not.toContain('h-full')
  })
})
