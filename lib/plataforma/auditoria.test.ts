import { describe, it, expect } from 'vitest'
import { filaDeAcceso, filaDeCambio } from './auditoria'

describe('filaDeAcceso', () => {
  it('marca la acción como ACCESO', () => {
    expect(filaDeAcceso('lab-1', 'yo@ejemplo.com').accion).toBe('ACCESO')
  })

  it('atribuye la visita al operador de la plataforma', () => {
    expect(filaDeAcceso('lab-1', 'yo@ejemplo.com').actor_plataforma).toBe('yo@ejemplo.com')
  })

  // Es la distinción que hace honesto el registro: ningún usuario del
  // laboratorio hizo esto, y decir lo contrario sería mentir en su historial.
  it('deja en nulo los campos del usuario del laboratorio', () => {
    const f = filaDeAcceso('lab-1', 'yo@ejemplo.com')
    expect(f.usuario_id).toBeNull()
    expect(f.usuario_nombre).toBeNull()
  })

  it('apunta a la fila del laboratorio visitado', () => {
    const f = filaDeAcceso('lab-1', 'yo@ejemplo.com')
    expect(f.laboratorio_id).toBe('lab-1')
    expect(f.registro_id).toBe('lab-1')
    expect(f.tabla).toBe('laboratorio')
  })

  it('normaliza el correo a minúsculas', () => {
    expect(filaDeAcceso('lab-1', '  YO@Ejemplo.com ').actor_plataforma).toBe('yo@ejemplo.com')
  })
})

describe('filaDeCambio', () => {
  const cambio = {
    tabla: 'perfil',
    registroId: 'u1',
    accion: 'UPDATE' as const,
    detalle: 'restableció la contraseña de Ana Torres',
  }

  it('guarda qué se hizo, no solo sobre qué tabla', () => {
    // Sin `detalle`, un restablecimiento de contraseña y un cambio de nombre
    // se leen igual en el historial: «UPDATE sobre perfil».
    expect(filaDeCambio('lab-1', 'yo@ejemplo.com', cambio).detalle).toBe(
      'restableció la contraseña de Ana Torres',
    )
  })

  it('atribuye el cambio al operador y no a un usuario del laboratorio', () => {
    const f = filaDeCambio('lab-1', 'YO@Ejemplo.com', cambio)
    expect(f.actor_plataforma).toBe('yo@ejemplo.com')
    expect(f.usuario_id).toBeNull()
    expect(f.usuario_nombre).toBeNull()
  })

  it('apunta a la fila cambiada dentro de su laboratorio', () => {
    const f = filaDeCambio('lab-1', 'yo@ejemplo.com', cambio)
    expect(f.laboratorio_id).toBe('lab-1')
    expect(f.tabla).toBe('perfil')
    expect(f.registro_id).toBe('u1')
    expect(f.accion).toBe('UPDATE')
  })

  it('admite altas además de modificaciones', () => {
    const f = filaDeCambio('lab-1', 'yo@ejemplo.com', { ...cambio, accion: 'INSERT' })
    expect(f.accion).toBe('INSERT')
  })
})
