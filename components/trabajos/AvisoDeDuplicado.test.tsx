import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvisoDeDuplicado } from './AvisoDeDuplicado'
import type { PosibleDuplicado } from '@/lib/trabajos/duplicados-data'

/*
  El aviso de posible duplicado.

  Un técnico registra un trabajo hoy y mañana otro registra el mismo: queda
  información falsa y se le cobra dos veces al consultorio. Cuando este aviso
  aparece, el trabajo **todavía no se guardó**.
*/

function dup(p: Partial<PosibleDuplicado> = {}): PosibleDuplicado {
  return {
    id: 'tr1',
    fecha_ingreso: '2026-09-14',
    paciente_nombre: 'Jeremías',
    doctor_nombre: 'Dra. Ruiz',
    consultorio_nombre: 'Arte oral',
    tipo_nombre: 'Corona porcelana',
    precio_acordado: 90,
    estado: 'en_curso',
    ...p,
  }
}

describe('AvisoDeDuplicado', () => {
  /*
    Lo primero que hay que dejar claro: no se guardó nada. Sin eso, quien lo
    lee no sabe si tiene que borrar algo o no.
  */
  it('dice que todavía no se guardó nada', () => {
    const { container } = render(<AvisoDeDuplicado duplicados={[dup()]} onCancelar={vi.fn()} />)
    expect(container.textContent).toContain('Todavía no se ha guardado nada')
  })

  it('nombra las tres validaciones que coincidieron', () => {
    const { container } = render(<AvisoDeDuplicado duplicados={[dup()]} onCancelar={vi.fn()} />)
    expect(container.textContent).toContain('consultorio')
    expect(container.textContent).toContain('paciente')
    expect(container.textContent).toContain('tipo')
    expect(container.textContent).toContain('5 días')
  })

  /*
    Todo lo que hace falta para reconocer el trabajo sin salir del formulario:
    qué es, de quién, cuándo entró, cuánto y en qué estado.
  */
  it('muestra los datos del trabajo que ya existe', () => {
    const { container } = render(<AvisoDeDuplicado duplicados={[dup()]} onCancelar={vi.fn()} />)
    expect(container.textContent).toContain('Corona porcelana')
    expect(container.textContent).toContain('Jeremías')
    expect(container.textContent).toContain('Dra. Ruiz')
    expect(container.textContent).toContain('2026-09-14')
    expect(container.textContent).toContain('90')
    expect(container.textContent).toContain('En curso')
  })

  it('el enlace de ver abre el trabajo en otra pestaña', () => {
    render(<AvisoDeDuplicado duplicados={[dup()]} onCancelar={vi.fn()} />)
    const ver = screen.getByRole('link', { name: /ver/i })
    expect(ver.getAttribute('href')).toBe('/trabajos/tr1')
    // En otra pestaña: mirar el existente no puede costar lo ya escrito.
    expect(ver.getAttribute('target')).toBe('_blank')
  })

  /*
    Si de verdad es un duplicado, lo que hace falta después es abrir el
    original —para cobrarlo, fotografiarlo o corregirlo—, no quedarse en un
    formulario que ya no sirve.
  */
  it('«ya está registrado» lleva al trabajo existente', () => {
    render(<AvisoDeDuplicado duplicados={[dup()]} onCancelar={vi.fn()} />)
    const ir = screen.getByRole('link', { name: /ya está registrado/i })
    expect(ir.getAttribute('href')).toBe('/trabajos/tr1')
  })

  it('con varios duplicados lleva a la lista', () => {
    render(
      <AvisoDeDuplicado
        duplicados={[dup(), dup({ id: 'tr2' })]}
        onCancelar={vi.fn()}
      />,
    )
    expect(screen.getByRole('link', { name: /ya están registrados/i }).getAttribute('href')).toBe(
      '/trabajos',
    )
  })

  /*
    Guardar es posible pero secundario: en los datos reales había cuatro pares
    de trabajos repetidos que eran encargos legítimos, así que la opción tiene
    que existir. Lo que no puede es invitar a pulsarla sin leer.
  */
  it('permite guardar de todos modos, con el campo de confirmación', () => {
    render(<AvisoDeDuplicado duplicados={[dup()]} onCancelar={vi.fn()} />)
    const guardar = screen.getByRole('button', { name: /es otro trabajo/i })
    expect(guardar.getAttribute('type')).toBe('submit')
    expect(guardar.getAttribute('name')).toBe('confirmado')
    expect(guardar.getAttribute('value')).toBe('1')
  })

  it('«corregir» vuelve al formulario sin enviar nada', async () => {
    const usuario = userEvent.setup()
    const onCancelar = vi.fn()
    render(<AvisoDeDuplicado duplicados={[dup()]} onCancelar={onCancelar} />)

    const corregir = screen.getByRole('button', { name: /corregir/i })
    expect(corregir.getAttribute('type')).toBe('button')
    await usuario.click(corregir)
    expect(onCancelar).toHaveBeenCalled()
  })

  it('es un aviso, para que los lectores de pantalla lo anuncien', () => {
    render(<AvisoDeDuplicado duplicados={[dup()]} onCancelar={vi.fn()} />)
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})
