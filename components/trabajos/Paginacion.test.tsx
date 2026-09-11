import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Paginacion } from './Paginacion'

const href = (p: number) => `/trabajos?pagina=${p}`

describe('Paginacion', () => {
  /*
    Con una sola página no se muestra nada. Unos controles que no llevan a
    ninguna parte son ruido en la pantalla que más se usa del sistema.
  */
  it('con una sola página no aparece', () => {
    const { container } = render(<Paginacion pagina={1} totalPaginas={1} hrefDe={href} />)
    expect(container.textContent).toBe('')
  })

  it('en la primera página solo ofrece siguiente', () => {
    render(<Paginacion pagina={1} totalPaginas={5} hrefDe={href} />)
    expect(screen.queryByRole('link', { name: /anterior/i })).toBeNull()
    expect(screen.getByRole('link', { name: /siguiente/i }).getAttribute('href')).toBe(
      '/trabajos?pagina=2',
    )
  })

  it('en la última solo ofrece anterior', () => {
    render(<Paginacion pagina={5} totalPaginas={5} hrefDe={href} />)
    expect(screen.getByRole('link', { name: /anterior/i }).getAttribute('href')).toBe(
      '/trabajos?pagina=4',
    )
    expect(screen.queryByRole('link', { name: /siguiente/i })).toBeNull()
  })

  it('en el medio ofrece las dos', () => {
    render(<Paginacion pagina={3} totalPaginas={5} hrefDe={href} />)
    expect(screen.getByRole('link', { name: /anterior/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /siguiente/i })).toBeTruthy()
  })

  it('dice en qué página se está', () => {
    const { container } = render(<Paginacion pagina={3} totalPaginas={5} hrefDe={href} />)
    expect(container.textContent).toContain('3 de 5')
  })

  /*
    Los enlaces los construye quien llama, que es quien conoce los filtros
    activos: pasar a la página 2 no puede perder el estado ni la búsqueda.
  */
  it('respeta los enlaces que le dan, con sus filtros', () => {
    render(
      <Paginacion
        pagina={2}
        totalPaginas={9}
        hrefDe={(p) => `/trabajos?estado=en_curso&q=corona&pagina=${p}`}
      />,
    )
    expect(screen.getByRole('link', { name: /siguiente/i }).getAttribute('href')).toBe(
      '/trabajos?estado=en_curso&q=corona&pagina=3',
    )
  })
})
