import { describe, it, expect } from 'vitest'
import { filaDeAcceso } from './auditoria'

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
