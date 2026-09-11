import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FotosDelTrabajo } from './FotosDelTrabajo'
import type { FotoConEnlace } from '@/lib/fotos/tipos'

/*
  Cámara y galería como dos botones separados.

  Se intentó con una sola entrada `accept="image/*"` confiando en que el
  teléfono ofreciera las dos opciones. En la práctica va directo a la galería y
  la cámara no aparece nunca. Estas pruebas fijan la solución para que nadie
  vuelva a juntarlas pensando que una basta.
*/

function foto(p: Partial<FotoConEnlace>): FotoConEnlace {
  return {
    id: 'f1',
    trabajo_id: 't1',
    momento: 'recepcion',
    orden: 1,
    ruta: 'lab/t1/recepcion-1-x.jpg',
    creado_en: '2026-09-11T10:00:00.000Z',
    url: 'https://ejemplo.invalid/firmada',
    ...p,
  }
}

function entradas(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll('input[type="file"]'))
}

describe('FotosDelTrabajo', () => {
  it('muestra los dos momentos', () => {
    render(<FotosDelTrabajo trabajoId="t1" fotos={[]} puedeEditar />)
    expect(screen.getByText('Como llegó')).toBeTruthy()
    expect(screen.getByText('Como se entregó')).toBeTruthy()
  })

  it('ofrece cámara y galería por separado', () => {
    render(<FotosDelTrabajo trabajoId="t1" fotos={[]} puedeEditar />)
    // Dos momentos × dos botones.
    expect(screen.getAllByRole('button', { name: /tomar foto con la cámara/i })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /elegir foto de la galería/i })).toHaveLength(2)
  })

  /*
    `capture="environment"` es lo que abre la cámara, y la trasera: la pieza
    está sobre la mesa, no delante de la cara. Sin este atributo el botón de
    cámara se comporta igual que el de galería, que es el fallo que hubo que
    corregir.
  */
  it('la entrada de cámara pide la cámara trasera', () => {
    render(<FotosDelTrabajo trabajoId="t1" fotos={[]} puedeEditar />)
    const conCaptura = entradas().filter((e) => e.getAttribute('capture') === 'environment')
    expect(conCaptura).toHaveLength(2)
  })

  /*
    Y la de galería NO lo lleva: con `capture` abriría la cámara y no habría
    forma de elegir una foto ya tomada.
  */
  it('la entrada de galería no fuerza la cámara', () => {
    render(<FotosDelTrabajo trabajoId="t1" fotos={[]} puedeEditar />)
    const sinCaptura = entradas().filter((e) => !e.hasAttribute('capture'))
    expect(sinCaptura).toHaveLength(2)
    for (const e of sinCaptura) expect(e.getAttribute('accept')).toBe('image/*')
  })

  it('cuenta cuántas fotos hay de cada momento', () => {
    const { container } = render(
      <FotosDelTrabajo trabajoId="t1" fotos={[foto({})]} puedeEditar />,
    )
    expect(container.textContent).toContain('1 de 2')
    expect(container.textContent).toContain('0 de 2')
  })

  /*
    Con el momento lleno desaparecen los botones: el tope de dos está en el
    contrato de encargo, y ofrecer un botón que va a rebotar es peor que no
    ofrecerlo.
  */
  it('con dos fotos ya no ofrece añadir en ese momento', () => {
    render(
      <FotosDelTrabajo
        trabajoId="t1"
        fotos={[foto({ id: 'a', orden: 1 }), foto({ id: 'b', orden: 2 })]}
        puedeEditar
      />,
    )
    // Solo quedan los del momento de entrega, que sigue vacío.
    expect(screen.getAllByRole('button', { name: /tomar foto con la cámara/i })).toHaveLength(1)
  })

  it('sin permiso de editar no ofrece subir ni borrar', () => {
    render(
      <FotosDelTrabajo trabajoId="t1" fotos={[foto({})]} puedeEditar={false} />,
    )
    expect(screen.queryByRole('button', { name: /cámara/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /eliminar/i })).toBeNull()
  })

  /*
    Si el enlace firmado no se pudo generar, la ficha se abre igual con un
    hueco. Peor sería no poder ver el trabajo por una imagen que no cargó.
  */
  it('una foto sin enlace no rompe la pantalla', () => {
    const { container } = render(
      <FotosDelTrabajo trabajoId="t1" fotos={[foto({ url: null })]} puedeEditar />,
    )
    expect(container.textContent).toContain('No se pudo cargar')
  })
})
