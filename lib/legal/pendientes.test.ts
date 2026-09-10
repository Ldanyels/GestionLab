import { describe, it, expect } from 'vitest'
import { datosDeAceptacionSchema, documentosPendientes, todoAceptado } from './pendientes'
import { DOCUMENTOS_LEGALES } from './textos.generated'

const aceptado = (clave: string, version: string) => ({ documento: clave, version })
const TODOS = DOCUMENTOS_LEGALES.map((d) => aceptado(d.clave, d.version))

describe('documentosPendientes', () => {
  it('sin nada aceptado, faltan los tres', () => {
    expect(documentosPendientes([]).map((d) => d.clave)).toEqual([
      'terminos',
      'privacidad',
      'encargo',
    ])
  })

  it('con todo aceptado, no falta nada', () => {
    expect(documentosPendientes(TODOS)).toEqual([])
  })

  it('solo falta el que no se aceptó', () => {
    const parcial = TODOS.filter((a) => a.documento !== 'encargo')
    expect(documentosPendientes(parcial).map((d) => d.clave)).toEqual(['encargo'])
  })

  /*
    El caso que da sentido a sellar los documentos: alguien aceptó la versión
    de antes. Una aceptación de un texto distinto no vale para el texto nuevo,
    porque no leyó esto.
  */
  it('una aceptación de una versión anterior no cuenta', () => {
    const viejas = TODOS.map((a) => aceptado(a.documento, 'v-00000000'))
    expect(documentosPendientes(viejas).map((d) => d.clave)).toEqual([
      'terminos',
      'privacidad',
      'encargo',
    ])
  })

  it('ignora aceptaciones de documentos que ya no existen', () => {
    expect(documentosPendientes([...TODOS, aceptado('inventado', 'v-1')])).toEqual([])
  })
})

describe('todoAceptado', () => {
  it('resume lo mismo en un sí o un no', () => {
    expect(todoAceptado(TODOS)).toBe(true)
    expect(todoAceptado([])).toBe(false)
  })
})

describe('datosDeAceptacionSchema', () => {
  const valido = { nombre: 'Ana Torres', dni: '45678912', cargo: 'Gerente' }

  it('acepta los datos completos y recorta espacios', () => {
    expect(datosDeAceptacionSchema.parse({ ...valido, nombre: '  Ana Torres  ' }).nombre).toBe(
      'Ana Torres',
    )
  })

  it('exige el nombre de quien acepta', () => {
    const r = datosDeAceptacionSchema.safeParse({ ...valido, nombre: '  ' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('Escribe tu nombre completo')
  })

  // El DNI peruano son 8 dígitos. Validarlo evita que un registro quede con
  // «12345» y no sirva para identificar a nadie.
  it('exige un DNI de ocho dígitos', () => {
    for (const dni of ['1234567', '123456789', '4567891a', '']) {
      expect(datosDeAceptacionSchema.safeParse({ ...valido, dni }).success).toBe(false)
    }
    expect(datosDeAceptacionSchema.safeParse(valido).success).toBe(true)
  })

  it('el cargo es opcional', () => {
    const r = datosDeAceptacionSchema.parse({ ...valido, cargo: '' })
    expect(r.cargo).toBeNull()
  })
})
