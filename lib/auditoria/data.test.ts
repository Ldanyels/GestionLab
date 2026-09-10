import { describe, it, expect } from 'vitest'
import { esDePlataforma, etiquetaAccion, etiquetaTabla, quienActuo } from './data'

const fila = (p: Partial<Parameters<typeof quienActuo>[0]> = {}) => ({
  usuario_nombre: 'Ana Torres',
  actor_plataforma: null,
  ...p,
})

describe('quienActuo', () => {
  it('nombra al usuario del laboratorio', () => {
    expect(quienActuo(fila())).toBe('Ana Torres')
  })

  /*
    Antes esto decía «Sistema», y era engañoso: un cambio hecho por el
    proveedor desde el panel de plataforma no lo hizo el sistema, lo hizo una
    persona con nombre y correo. El laboratorio tiene que poder distinguirlo de
    lo que hace su propio equipo.
  */
  it('nombra al proveedor cuando el cambio vino de la plataforma', () => {
    expect(quienActuo(fila({ usuario_nombre: null, actor_plataforma: 'yo@skardiam.com' }))).toBe(
      'Soporte de GestionLab (yo@skardiam.com)',
    )
  })

  it('el proveedor manda sobre el nombre, si por algo vinieran los dos', () => {
    expect(quienActuo(fila({ actor_plataforma: 'yo@skardiam.com' }))).toContain('Soporte')
  })

  it('sin ninguno de los dos, lo llama sistema', () => {
    expect(quienActuo(fila({ usuario_nombre: null }))).toBe('Sistema')
  })
})

describe('esDePlataforma', () => {
  it('distingue el origen para poder marcarlo en pantalla', () => {
    expect(esDePlataforma(fila({ actor_plataforma: 'yo@skardiam.com' }))).toBe(true)
    expect(esDePlataforma(fila())).toBe(false)
  })
})

describe('etiquetaAccion', () => {
  it('traduce las acciones de datos', () => {
    expect(etiquetaAccion('INSERT')).toBe('Creó')
    expect(etiquetaAccion('UPDATE')).toBe('Actualizó')
    expect(etiquetaAccion('DELETE')).toBe('Eliminó')
  })

  // La acción que registra una visita del proveedor, no un cambio de datos.
  it('traduce el acceso de la plataforma', () => {
    expect(etiquetaAccion('ACCESO')).toBe('Consultó')
  })

  it('una acción desconocida se muestra tal cual en vez de desaparecer', () => {
    expect(etiquetaAccion('RARO')).toBe('RARO')
  })
})

describe('etiquetaTabla', () => {
  it('nombra las tablas en español', () => {
    expect(etiquetaTabla('trabajo')).toBe('Trabajo')
    expect(etiquetaTabla('catalogo_trabajo')).toBe('Catálogo')
  })

  // Al registrar un acceso se apunta contra la fila del laboratorio.
  it('nombra el acceso a la cuenta', () => {
    expect(etiquetaTabla('laboratorio')).toBe('Cuenta del laboratorio')
  })
})
