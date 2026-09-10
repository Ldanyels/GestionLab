import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UsuariosDeLaboratorio } from './UsuariosDeLaboratorio'
import type { UsuarioItem } from '@/lib/usuarios/data'

const nada = vi.fn(async () => {})

const usuarios: UsuarioItem[] = [
  { id: 'u1', nombre: 'Ana Torres', rol: 'admin', email: 'ana@lab.pe', permisos: [] },
  { id: 'u2', nombre: 'Beto Ruiz', rol: 'tecnico', email: 'beto@lab.pe', permisos: [] },
]

describe('UsuariosDeLaboratorio', () => {
  it('lista a cada persona con su correo y su rol', () => {
    render(<UsuariosDeLaboratorio labId="l1" usuarios={usuarios} accion={nada} />)
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText(/ana@lab\.pe/)).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByText('Técnico')).toBeInTheDocument()
  })

  it('da un campo de contraseña nueva por cada usuario', () => {
    render(<UsuariosDeLaboratorio labId="l1" usuarios={usuarios} accion={nada} />)
    expect(screen.getAllByLabelText('Contraseña nueva')).toHaveLength(2)
  })

  // El operador la dicta por teléfono: ocultarla obligaría a teclearla a
  // ciegas para una clave que además es temporal.
  it('la contraseña se ve, para poder dictarla', () => {
    render(<UsuariosDeLaboratorio labId="l1" usuarios={usuarios} accion={nada} />)
    expect(screen.getAllByLabelText('Contraseña nueva')[0]).toHaveAttribute('type', 'text')
  })

  it('manda el laboratorio y el usuario en el formulario', () => {
    const { container } = render(
      <UsuariosDeLaboratorio labId="l1" usuarios={usuarios} accion={nada} />,
    )
    expect(container.querySelector('input[name="laboratorio_id"]')).toHaveAttribute(
      'value',
      'l1',
    )
    expect(container.querySelector('input[name="usuario_id"]')).toHaveAttribute('value', 'u1')
  })

  // Decisión explícita: borrar elimina en cascada el perfil, y en un
  // laboratorio ajeno el operador no sabe quién es esa persona. Su propio
  // administrador sí, y ya puede hacerlo desde su pantalla.
  it('no ofrece borrar usuarios', () => {
    render(<UsuariosDeLaboratorio labId="l1" usuarios={usuarios} accion={nada} />)
    expect(screen.queryByRole('button', { name: /eliminar|borrar|quitar/i })).toBeNull()
  })

  it('enlaza al alta de un usuario nuevo', () => {
    render(<UsuariosDeLaboratorio labId="l1" usuarios={usuarios} accion={nada} />)
    expect(screen.getByRole('link', { name: /usuario/i })).toHaveAttribute(
      'href',
      '/plataforma/l1/usuarios/nuevo',
    )
  })

  it('sin usuarios lo dice, en vez de mostrar una lista vacía', () => {
    render(<UsuariosDeLaboratorio labId="l1" usuarios={[]} accion={nada} />)
    expect(screen.getByText(/no tiene usuarios/i)).toBeInTheDocument()
  })
})
