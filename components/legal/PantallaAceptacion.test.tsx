import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PantallaAceptacion } from './PantallaAceptacion'
import { DOCUMENTOS_LEGALES } from '@/lib/legal/textos.generated'

const nada = vi.fn(async () => ({ error: '' }))
const TRES = [...DOCUMENTOS_LEGALES]

function pintar(documentos = TRES, error = '') {
  return render(
    <PantallaAceptacion
      documentos={documentos}
      laboratorio="MasterLab"
      action={nada}
      errorInicial={error}
    />,
  )
}

describe('PantallaAceptacion', () => {
  it('nombra el laboratorio que se compromete', () => {
    pintar()
    expect(screen.getByText(/MasterLab/)).toBeInTheDocument()
  })

  it('muestra el texto completo de cada documento, no solo su nombre', () => {
    const { container } = pintar()
    // Que estén los tres textos: nadie acepta lo que no puede leer.
    for (const d of TRES) {
      expect(screen.getByRole('heading', { name: d.titulo })).toBeInTheDocument()
    }
    expect(container.textContent).toMatch(/Ley N° 29733/)
  })

  it('pide una casilla por documento, no una sola para los tres', () => {
    pintar()
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    for (const d of TRES) {
      expect(screen.getByRole('checkbox', { name: new RegExp(d.titulo, 'i') })).toBeRequired()
    }
  })

  it('pide nombre y DNI de quien acepta', () => {
    pintar()
    expect(screen.getByLabelText('Nombre completo')).toHaveAttribute('name', 'nombre')
    expect(screen.getByLabelText('DNI')).toHaveAttribute('name', 'dni')
    expect(screen.getByLabelText(/Cargo/)).toHaveAttribute('name', 'cargo')
  })

  // Es el dato que hace verificable el registro: prueba qué texto se aceptó.
  it('lleva la versión de cada documento en el envío', () => {
    const { container } = pintar()
    for (const d of TRES) {
      expect(
        container.querySelector(`input[name="documento"][value="${d.clave}"]`),
      ).toBeInTheDocument()
    }
  })

  it('muestra la huella del documento, para que se pueda verificar', () => {
    const { container } = pintar()
    expect(container.textContent).toContain(TRES[0]!.version)
  })

  it('si solo cambió un documento, solo pide ese', () => {
    pintar([TRES[1]!])
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    expect(screen.getByText(/actualizamos/i)).toBeInTheDocument()
  })

  it('muestra el error del servidor', () => {
    pintar(TRES, 'Falta marcar un documento')
    expect(screen.getByRole('alert')).toHaveTextContent('Falta marcar un documento')
  })

  // No hay foto de DNI, y es una decisión, no un olvido.
  it('no pide subir ningún archivo', () => {
    const { container } = pintar()
    expect(container.querySelector('input[type="file"]')).toBeNull()
  })
})
