import { describe, it, expect } from 'vitest'
import { datosDeAceptacionSchema, documentosPendientes, todoAceptado } from './pendientes'

/*
  Las pruebas usan documentos propios en vez de los reales: los de verdad están
  hoy marcados como borrador, y una prueba que dependa de ese estado se rompe
  el día que el abogado los apruebe.
*/
const APROBADOS = [
  { clave: 'terminos', titulo: 'Términos', version: 'v-aaa', hash: 'a', html: '<p>a</p>', esBorrador: false },
  { clave: 'privacidad', titulo: 'Privacidad', version: 'v-bbb', hash: 'b', html: '<p>b</p>', esBorrador: false },
  { clave: 'encargo', titulo: 'Encargo', version: 'v-ccc', hash: 'c', html: '<p>c</p>', esBorrador: false },
] as const

const aceptado = (clave: string, version: string) => ({ documento: clave, version })
const TODOS = APROBADOS.map((d) => aceptado(d.clave, d.version))

describe('documentosPendientes', () => {
  it('sin nada aceptado, faltan los tres', () => {
    expect(documentosPendientes([], APROBADOS).map((d) => d.clave)).toEqual([
      'terminos',
      'privacidad',
      'encargo',
    ])
  })

  it('con todo aceptado, no falta nada', () => {
    expect(documentosPendientes(TODOS, APROBADOS)).toEqual([])
  })

  it('solo falta el que no se aceptó', () => {
    const parcial = TODOS.filter((a) => a.documento !== 'encargo')
    expect(documentosPendientes(parcial, APROBADOS).map((d) => d.clave)).toEqual(['encargo'])
  })

  /*
    El caso que da sentido a sellar los documentos: alguien aceptó la versión
    de antes. Una aceptación de un texto distinto no vale para el texto nuevo,
    porque no leyó esto.
  */
  it('una aceptación de una versión anterior no cuenta', () => {
    const viejas = TODOS.map((a) => aceptado(a.documento, 'v-00000000'))
    expect(documentosPendientes(viejas, APROBADOS).map((d) => d.clave)).toEqual([
      'terminos',
      'privacidad',
      'encargo',
    ])
  })

  it('ignora aceptaciones de documentos que ya no existen', () => {
    expect(documentosPendientes([...TODOS, aceptado('inventado', 'v-1')], APROBADOS)).toEqual([])
  })

  // Hoy los tres documentos reales son borradores, así que no se pide ninguno.
  // Esta prueba documenta ese estado y fallará —correctamente— cuando se
  // aprueben, avisando de que la puerta pasa a estar activa.
  it('con los documentos reales de hoy no se pide nada: siguen en borrador', () => {
    expect(documentosPendientes([])).toEqual([])
  })
})

describe('todoAceptado', () => {
  it('resume lo mismo en un sí o un no', () => {
    expect(todoAceptado(TODOS, APROBADOS)).toBe(true)
    expect(todoAceptado([], APROBADOS)).toBe(false)
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

describe('documentosPendientes con borradores', () => {
  const borrador = (clave: string) => ({
    clave: clave as never,
    titulo: 'X',
    version: 'v-1',
    hash: 'h',
    html: '<p>x</p>',
    esBorrador: true,
  })

  /*
    La salvaguarda que evita el peor despliegue posible: si un documento sigue
    marcado como borrador para revisión legal, NO se pide aceptarlo. Un cliente
    leyendo «Borrador para revisión legal» en la pantalla que le bloquea el
    acceso sería peor que no pedirle nada.

    Es automático a propósito. Una advertencia en un README hay que recordarla;
    esto se activa solo cuando el abogado aprueba y se retira la nota, porque
    retirarla cambia la huella.
  */
  it('un borrador no se pide aceptar', () => {
    expect(documentosPendientes([], [borrador('terminos')])).toEqual([])
  })

  it('conviven: se pide solo lo aprobado', () => {
    const aprobado = { ...borrador('privacidad'), esBorrador: false }
    const pendientes = documentosPendientes([], [borrador('terminos'), aprobado])
    expect(pendientes.map((d) => d.clave)).toEqual(['privacidad'])
  })

  it('todoAceptado es cierto si lo único que falta son borradores', () => {
    expect(todoAceptado([], [borrador('terminos')])).toBe(true)
  })
})
