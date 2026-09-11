import { describe, it, expect } from 'vitest'
import { LADO_MAXIMO, medidasReducidas } from './comprimir'

describe('medidasReducidas', () => {
  /*
    La compresión es lo que hace viable esto: una foto de teléfono son 3–8 MB y
    subirla con el wifi de un taller tarda decenas de segundos y falla seguido.
    Reducida al lado máximo son ~300 KB y unos dos segundos.
  */
  it('reduce el lado más largo al máximo', () => {
    expect(medidasReducidas(4000, 3000)).toEqual({ ancho: LADO_MAXIMO, alto: 1200 })
  })

  it('funciona igual en vertical', () => {
    expect(medidasReducidas(3000, 4000)).toEqual({ ancho: 1200, alto: LADO_MAXIMO })
  })

  it('mantiene la proporción', () => {
    const { ancho, alto } = medidasReducidas(4000, 2000)
    expect(ancho / alto).toBeCloseTo(2, 5)
  })

  /*
    Una foto ya pequeña no se agranda. Escalarla hacia arriba no añade detalle
    —solo peso— y además se vería peor que el original.
  */
  it('no agranda una foto que ya es pequeña', () => {
    expect(medidasReducidas(800, 600)).toEqual({ ancho: 800, alto: 600 })
  })

  it('en el límite exacto no cambia nada', () => {
    expect(medidasReducidas(LADO_MAXIMO, 900)).toEqual({ ancho: LADO_MAXIMO, alto: 900 })
  })

  /*
    Los lados se redondean a enteros: un canvas de 1066,67 píxeles no existe, y
    pasarle un decimal lo trunca de formas distintas según el navegador.
  */
  it('devuelve enteros', () => {
    const { ancho, alto } = medidasReducidas(3333, 2222)
    expect(Number.isInteger(ancho)).toBe(true)
    expect(Number.isInteger(alto)).toBe(true)
  })

  it('nunca devuelve cero', () => {
    const { ancho, alto } = medidasReducidas(5000, 1)
    expect(ancho).toBe(LADO_MAXIMO)
    expect(alto).toBeGreaterThanOrEqual(1)
  })
})
