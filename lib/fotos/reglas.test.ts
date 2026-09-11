import { describe, it, expect } from 'vitest'
import {
  MAX_POR_MOMENTO,
  MOMENTOS,
  esMomento,
  estaVencida,
  fechaDeCaducidad,
  huecoLibre,
  rutaDeFoto,
} from './reglas'

describe('MOMENTOS', () => {
  it('son los dos extremos de la conversación con el consultorio', () => {
    expect(MOMENTOS).toEqual(['recepcion', 'entrega'])
  })

  it('reconoce solo los momentos válidos', () => {
    expect(esMomento('recepcion')).toBe(true)
    expect(esMomento('entrega')).toBe(true)
    expect(esMomento('otro')).toBe(false)
    expect(esMomento('')).toBe(false)
  })
})

describe('huecoLibre', () => {
  it('con ninguna foto, la primera va al hueco 1', () => {
    expect(huecoLibre([])).toBe(1)
  })

  it('con la 1 ocupada, la siguiente va al 2', () => {
    expect(huecoLibre([1])).toBe(2)
  })

  /*
    El tope es dos por momento, tal como dice el contrato de encargo. Devolver
    `null` y no lanzar: que no quepa otra foto es un caso normal, no un fallo.
  */
  it('con las dos ocupadas, no hay hueco', () => {
    expect(huecoLibre([1, 2])).toBeNull()
    expect(MAX_POR_MOMENTO).toBe(2)
  })

  /*
    Si se borra la primera, el hueco que queda es el 1 y ahí entra la siguiente.
    Sin esto, tras borrar una foto habría que borrar la otra para poder subir.
  */
  it('reutiliza el hueco de una foto borrada', () => {
    expect(huecoLibre([2])).toBe(1)
  })
})

describe('rutaDeFoto', () => {
  /*
    La ruta empieza por el id del laboratorio porque de ahí lo deduce la
    política de `storage.objects`: la primera carpeta dice de quién es el
    archivo. Si cambiara el orden, el aislamiento del almacenamiento dejaría de
    funcionar sin que ninguna prueba de la aplicación se entere.
  */
  it('empieza por el laboratorio y sigue por el trabajo', () => {
    const ruta = rutaDeFoto('lab-1', 'trab-2', 'recepcion', 1, 'abc123')
    expect(ruta.startsWith('lab-1/trab-2/')).toBe(true)
  })

  it('distingue momento y posición', () => {
    expect(rutaDeFoto('l', 't', 'recepcion', 1, 'x')).toContain('recepcion-1')
    expect(rutaDeFoto('l', 't', 'entrega', 2, 'x')).toContain('entrega-2')
  })

  /*
    El sufijo único evita que al reemplazar una foto el navegador siga
    mostrando la anterior desde su caché: el nombre cambia, así que la imagen
    vieja deja de existir para él.
  */
  it('incluye un sufijo único', () => {
    expect(rutaDeFoto('l', 't', 'recepcion', 1, 'abc')).toContain('abc')
    expect(rutaDeFoto('l', 't', 'recepcion', 1, 'abc')).not.toBe(
      rutaDeFoto('l', 't', 'recepcion', 1, 'xyz'),
    )
  })

  it('termina en .jpg', () => {
    expect(rutaDeFoto('l', 't', 'entrega', 1, 'abc').endsWith('.jpg')).toBe(true)
  })
})

describe('caducidad a los 6 meses', () => {
  const tomada = '2026-03-11T10:00:00.000Z'

  it('caduca seis meses después', () => {
    expect(fechaDeCaducidad(tomada)).toBe('2026-09-11T10:00:00.000Z')
  })

  it('una foto de hoy no está vencida', () => {
    expect(estaVencida(tomada, '2026-09-10T10:00:00.000Z')).toBe(false)
  })

  it('al cumplirse los seis meses, vence', () => {
    expect(estaVencida(tomada, '2026-09-11T10:00:01.000Z')).toBe(true)
  })

  /*
    Cruzar meses de distinta longitud no puede adelantar ni atrasar el borrado:
    el 31 de agosto más seis meses es el 28 de febrero, no el 3 de marzo. Si se
    desbordara, se borrarían fotos antes de tiempo —y el borrado no se deshace.
  */
  it('recorta al último día del mes cuando el día no existe', () => {
    expect(fechaDeCaducidad('2026-08-31T12:00:00.000Z')).toBe('2027-02-28T12:00:00.000Z')
  })
})
