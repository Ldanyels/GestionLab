import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AvisoSinConexion } from './AvisoSinConexion'

/**
 * Pone `navigator.onLine` y dispara el evento correspondiente, como haría el
 * navegador al perder o recuperar la red.
 */
function conexion(enLinea: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(enLinea)
  act(() => {
    window.dispatchEvent(new Event(enLinea ? 'online' : 'offline'))
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AvisoSinConexion', () => {
  it('con conexión no muestra nada', () => {
    const { container } = render(<AvisoSinConexion />)
    expect(container.textContent).toBe('')
  })

  it('al perder la conexión avisa', () => {
    render(<AvisoSinConexion />)
    conexion(false)
    expect(screen.getByRole('status').textContent).toContain('Sin conexión')
  })

  /*
    El aviso dice qué pasa con lo que el técnico acaba de escribir. «Sin
    conexión» a secas lo deja decidiendo si perdió el trabajo o no, y la
    respuesta —no lo perdió— es justo la que evita que lo teclee otra vez.
  */
  it('dice que lo escrito no se pierde', () => {
    render(<AvisoSinConexion />)
    conexion(false)
    expect(screen.getByRole('status').textContent).toContain('sigue en pantalla')
  })

  it('al volver la conexión desaparece', () => {
    render(<AvisoSinConexion />)
    conexion(false)
    expect(screen.queryByRole('status')).not.toBeNull()
    conexion(true)
    expect(screen.queryByRole('status')).toBeNull()
  })

  /*
    Si la página se abre ya sin conexión —desde la caché del navegador— no
    llega ningún evento. Sin la lectura inicial al montar, el aviso no
    aparecería nunca en el caso más probable de todos.
  */
  it('avisa aunque la página se abra ya sin conexión', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    render(<AvisoSinConexion />)
    expect(screen.queryByRole('status')).not.toBeNull()
  })
})
