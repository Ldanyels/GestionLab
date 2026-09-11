import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { FilaDeGasto } from './FilaDeGasto'

describe('FilaDeGasto', () => {
  it('muestra el importe y su porcentaje del total', () => {
    const { container } = render(<FilaDeGasto etiqueta="Mano de obra" monto={250} total={1000} />)
    expect(container.textContent).toContain('Mano de obra')
    expect(container.textContent).toContain('250')
    expect(container.textContent).toContain('25%')
  })

  /*
    Con total cero la barra queda vacía y el porcentaje en 0. Llenarla diría que
    esa línea es el 100% de nada, que es lo que vería un laboratorio en su
    primer mes.
  */
  it('sin total, el porcentaje es cero y la barra queda vacía', () => {
    const { container } = render(<FilaDeGasto etiqueta="Servicios" monto={0} total={0} />)
    expect(container.textContent).toContain('0%')
    const barra = container.querySelector('[style*="width"]') as HTMLElement
    expect(barra.style.width).toBe('0%')
  })

  it('la barra llega al 100% cuando la línea es todo el gasto', () => {
    const { container } = render(<FilaDeGasto etiqueta="Materiales" monto={500} total={500} />)
    const barra = container.querySelector('[style*="width"]') as HTMLElement
    expect(barra.style.width).toBe('100%')
  })

  it('redondea el porcentaje a entero', () => {
    const { container } = render(<FilaDeGasto etiqueta="X" monto={333} total={1000} />)
    expect(container.textContent).toContain('33%')
  })
})
