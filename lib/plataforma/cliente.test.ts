import { describe, it, expect, beforeAll } from 'vitest'
import { clienteDeLaboratorio } from './cliente'

beforeAll(() => {
  // Credenciales falsas: construir una consulta no hace ninguna petición, así
  // que la prueba no necesita un proyecto real ni red.
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://ejemplo.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-de-prueba'
})

/**
 * La URL que construye postgrest-js. Es la única forma de comprobar el acotado
 * sin simulacros: si el filtro está, aparece en la cadena de consulta.
 */
function urlDe(consulta: unknown): string {
  return String((consulta as { url: URL }).url)
}

describe('clienteDeLaboratorio', () => {
  it('acota toda lectura al laboratorio', () => {
    const c = clienteDeLaboratorio('lab-1')
    expect(urlDe(c.leer('trabajo', 'id'))).toContain('laboratorio_id=eq.lab-1')
  })

  // Lo que hace útil el envoltorio: quien lo use puede seguir filtrando sin
  // poder quitar el acotado por descuido.
  it('el acotado sobrevive a los filtros que se encadenen después', () => {
    const c = clienteDeLaboratorio('lab-1')
    const url = urlDe(c.leer('trabajo', 'id').eq('estado', 'entregado'))
    expect(url).toContain('laboratorio_id=eq.lab-1')
    expect(url).toContain('estado=eq.entregado')
  })

  // La tabla `laboratorio` no tiene columna `laboratorio_id`: se identifica por
  // `id`. Sin este método, leerla con `leer()` filtraría por una columna que no
  // existe y la consulta fallaría.
  it('la propia fila del laboratorio se acota por id', () => {
    const c = clienteDeLaboratorio('lab-1')
    expect(urlDe(c.laboratorio('id, nombre'))).toContain('id=eq.lab-1')
  })

  it('no admite un laboratorio vacío', () => {
    expect(() => clienteDeLaboratorio('')).toThrow(/laboratorio/i)
  })

  it('recuerda a qué laboratorio pertenece', () => {
    expect(clienteDeLaboratorio('lab-1').laboratorioId).toBe('lab-1')
  })
})

describe('clienteDeLaboratorio — escritura', () => {
  it('acota el UPDATE al laboratorio', () => {
    const c = clienteDeLaboratorio('lab-1')
    const url = urlDe(c.escribir('trabajo', { precio_acordado: 400 }).eq('id', 't1'))
    expect(url).toContain('laboratorio_id=eq.lab-1')
    expect(url).toContain('id=eq.t1')
  })

  // Sin RLS, esto es lo único que impide que un identificador de otro
  // laboratorio se cuele y se modifique la fila equivocada.
  it('el acotado va aunque no se filtre por id', () => {
    const c = clienteDeLaboratorio('lab-1')
    expect(urlDe(c.escribir('trabajo', { estado: 'cerrado' }))).toContain(
      'laboratorio_id=eq.lab-1',
    )
  })

  it('acota el DELETE al laboratorio', () => {
    const c = clienteDeLaboratorio('lab-1')
    const url = urlDe(c.borrar('abono').eq('id', 'a1'))
    expect(url).toContain('laboratorio_id=eq.lab-1')
    expect(url).toContain('id=eq.a1')
  })
})
