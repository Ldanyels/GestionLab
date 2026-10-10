import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from './Sheet'

describe('Sheet', () => {
  it('no renderiza nada cuando está cerrada', () => {
    render(
      <Sheet abierta={false} onCerrar={() => {}} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('abierta muestra título y contenido en un diálogo modal', () => {
    render(
      <Sheet abierta onCerrar={() => {}} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    const dialogo = screen.getByRole('dialog')
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Tipo de trabajo')).toBeInTheDocument()
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })

  it('cierra con el botón de cierre', async () => {
    const onCerrar = vi.fn()
    render(
      <Sheet abierta onCerrar={onCerrar} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(onCerrar).toHaveBeenCalledOnce()
  })

  it('cierra con la tecla Escape', async () => {
    const onCerrar = vi.fn()
    render(
      <Sheet abierta onCerrar={onCerrar} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onCerrar).toHaveBeenCalledOnce()
  })
})

/**
 * Un `visualViewport` de mentira, para simular el teclado del teléfono.
 *
 * jsdom no lo trae. Sin él no se puede probar justamente lo que se vino a
 * arreglar, que solo ocurre con el teclado fuera.
 */
function fingirVisualViewport(alto: number, top = 0) {
  const oyentes: Record<string, (() => void)[]> = { resize: [], scroll: [] }
  const vv = {
    height: alto,
    offsetTop: top,
    addEventListener: (tipo: string, fn: () => void) => oyentes[tipo]?.push(fn),
    removeEventListener: (tipo: string, fn: () => void) => {
      oyentes[tipo] = (oyentes[tipo] ?? []).filter((x) => x !== fn)
    },
  }
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true, writable: true })
  return {
    /** Lo que hace el teclado al salir: el área visible se reduce. */
    abrirTeclado(nuevoAlto: number, nuevoTop = 0) {
      vv.height = nuevoAlto
      vv.offsetTop = nuevoTop
      act(() => oyentes.resize?.forEach((fn) => fn()))
    },
  }
}

function fondo(): HTMLElement {
  return screen.getByRole('dialog')
}

function panel(): HTMLElement {
  return fondo().firstElementChild as HTMLElement
}

describe('Sheet — el teclado del teléfono no puede tapar la lista', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'visualViewport')
  })

  /*
    El fallo: `position: fixed` mide la ventana de maquetación, que no encoge
    con el teclado. La hoja se apoyaba en el borde inferior de esa ventana, que
    está debajo de las teclas, y al escribir en el buscador la lista se acortaba
    y los nombres quedaban ocultos justo cuando hacían falta.
  */
  it('el fondo se ciñe al alto visible, no al de la ventana', () => {
    fingirVisualViewport(800)
    render(
      <Sheet abierta onCerrar={() => {}} titulo="Doctor">
        contenido
      </Sheet>,
    )
    expect(fondo().style.height).toBe('800px')
    // Sin soltar `bottom`, fijar el alto no serviría: con top y bottom puestos
    // el navegador ignora la altura.
    expect(fondo().style.bottom).toBe('auto')
  })

  it('al salir el teclado, el fondo se encoge con él', () => {
    const vv = fingirVisualViewport(800)
    render(
      <Sheet abierta onCerrar={() => {}} titulo="Doctor">
        contenido
      </Sheet>,
    )
    vv.abrirTeclado(420)
    expect(fondo().style.height).toBe('420px')
  })

  /* En iOS el teclado desplaza la página en vez de encogerla. */
  it('sigue el desplazamiento de la página, no solo su alto', () => {
    const vv = fingirVisualViewport(800)
    render(
      <Sheet abierta onCerrar={() => {}} titulo="Doctor">
        contenido
      </Sheet>,
    )
    vv.abrirTeclado(420, 180)
    expect(fondo().style.top).toBe('180px')
  })

  /*
    Con el teclado guardado, lo visible es la pantalla entera: sin el `min()`
    la hoja se comería la página y dejaría de parecer una hoja.
  */
  it('el panel nunca pasa del 82 % aunque quepa más', () => {
    fingirVisualViewport(800)
    render(
      <Sheet abierta onCerrar={() => {}} titulo="Doctor">
        contenido
      </Sheet>,
    )
    expect(panel().style.getPropertyValue('--alto-hoja')).toBe('min(82vh, 800px)')
  })

  /*
    Lo que faltaba. La hoja crecía con su contenido, así que al escribir la
    lista se acortaba, la hoja se encogía —sigue apoyada abajo— y se quedaba en
    el título y el campo: el hueco de los nombres se iba a cero justo cuando se
    estaba buscando.
  */
  it('el alto es fijo, no el del contenido: tecleando no se encoge', () => {
    const vv = fingirVisualViewport(800)
    render(
      <Sheet abierta onCerrar={() => {}} titulo="Doctor">
        contenido
      </Sheet>,
    )
    expect(panel().className).toContain('h-[var(--alto-hoja)]')

    vv.abrirTeclado(390)
    // Con el teclado fuera gana el alto visible: la hoja ocupa todo lo que
    // queda, que es lo que hace falta para que quepan nombres.
    expect(panel().style.getPropertyValue('--alto-hoja')).toBe('min(82vh, 390px)')
  })

  /* En pantalla grande no hay teclado que tape nada: la hoja se ajusta. */
  it('en pantalla grande el alto vuelve a ser el del contenido', () => {
    fingirVisualViewport(800)
    render(
      <Sheet abierta onCerrar={() => {}} titulo="Doctor">
        contenido
      </Sheet>,
    )
    expect(panel().className).toContain('sm:h-auto')
  })

  it('donde no existe `visualViewport`, se comporta como siempre', () => {
    render(
      <Sheet abierta onCerrar={() => {}} titulo="Doctor">
        contenido
      </Sheet>,
    )
    expect(fondo().style.height).toBe('')
    expect(fondo().style.bottom).toBe('')
    // Sin la medida real, el 82 % de siempre.
    expect(panel().style.getPropertyValue('--alto-hoja')).toBe('82vh')
  })
})

describe('Sheet — el buscador no se desplaza con la lista', () => {
  /*
    Estaba dentro de la zona que hace scroll, así que con una lista larga se iba
    de la pantalla y había que subir para corregir lo escrito.
  */
  it('lo fijo queda fuera del contenedor que hace scroll', () => {
    render(
      <Sheet abierta onCerrar={() => {}} titulo="Doctor" fijo={<input aria-label="Buscar" />}>
        <p>una lista muy larga</p>
      </Sheet>,
    )
    const buscador = screen.getByLabelText('Buscar')
    const scroll = screen.getByText('una lista muy larga').parentElement!
    expect(scroll.className).toContain('overflow-y-auto')
    expect(scroll.contains(buscador)).toBe(false)
  })

  it('sin `fijo` no se añade ningún hueco', () => {
    const { container } = render(
      <Sheet abierta onCerrar={() => {}} titulo="Doctor">
        <p>contenido</p>
      </Sheet>,
    )
    expect(container.querySelectorAll('input')).toHaveLength(0)
  })
})
