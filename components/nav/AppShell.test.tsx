import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'
import type { Perfil } from '@/lib/supabase/types'

const admin: Perfil = {
  id: '1',
  laboratorio_id: 'l',
  nombre: 'Ana',
  rol: 'admin',
  permisos: [],
}

describe('AppShell', () => {
  it('renderiza el contenido dentro de un main', () => {
    render(
      <AppShell perfil={admin}>
        <p>contenido</p>
      </AppShell>,
    )
    expect(screen.getByRole('main')).toHaveTextContent('contenido')
  })

  it('el contenido no supera 880 px', () => {
    render(
      <AppShell perfil={admin}>
        <p>contenido</p>
      </AppShell>,
    )
    expect(screen.getByRole('main').className).toContain('max-w-[880px]')
  })

  it('el header móvil ofrece Configuración al administrador', () => {
    render(
      <AppShell perfil={admin}>
        <p>contenido</p>
      </AppShell>,
    )
    expect(screen.getAllByRole('link', { name: /configuración/i }).length).toBeGreaterThan(0)
  })

  it('el técnico no ve Configuración', () => {
    render(
      <AppShell perfil={{ ...admin, rol: 'tecnico' }}>
        <p>contenido</p>
      </AppShell>,
    )
    expect(screen.queryByRole('link', { name: /configuración/i })).toBeNull()
  })

  // El enlace no depende del rol del perfil: un administrador de laboratorio
  // no administra la plataforma. La bandera la calcula el servidor.
  // Dos veces: en la barra lateral de escritorio y en el encabezado móvil. Sin
  // el segundo, en el teléfono había que escribir la dirección a mano.
  it('ofrece Plataforma cuando la sesión es de super-administrador', () => {
    render(
      <AppShell perfil={admin} esSuperAdmin>
        <p>contenido</p>
      </AppShell>,
    )
    const enlaces = screen.getAllByRole('link', { name: /Plataforma/ })
    expect(enlaces).toHaveLength(2)
    for (const e of enlaces) expect(e).toHaveAttribute('href', '/plataforma')
  })

  it('no ofrece Plataforma a un administrador de laboratorio cualquiera', () => {
    render(
      <AppShell perfil={admin}>
        <p>contenido</p>
      </AppShell>,
    )
    expect(screen.queryByRole('link', { name: 'Plataforma' })).toBeNull()
  })

  it('monta las dos navegaciones: lateral y barra inferior', () => {
    render(
      <AppShell perfil={admin}>
        <p>contenido</p>
      </AppShell>,
    )
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(2)
  })
})
