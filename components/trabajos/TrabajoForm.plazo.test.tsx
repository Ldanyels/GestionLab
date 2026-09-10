import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrabajoForm } from './TrabajoForm'
import type { CatalogoTrabajo } from '@/lib/catalogo/types'
import type { TrabajoDetalle } from '@/lib/trabajos/types'

/*
  La fecha de entrega, que es el dato que el sistema no conseguía capturar.

  En el piloto quedó vacía en 46 de 47 trabajos, y estas pruebas fijan las
  reglas que lo corrigen: se calcula sola desde el plazo del tipo, se ajusta con
  un toque, y **nunca se le asigna sola a un trabajo que ya existe**.
*/

const INGRESO = '2026-09-10'

async function accion() {
  return { error: '' }
}

function tipo(p: Partial<CatalogoTrabajo>): CatalogoTrabajo {
  return {
    id: 't1',
    laboratorio_id: 'l',
    categoria: 'Fija',
    nombre: 'Corona porcelana',
    precio_base: 90,
    variable_etiqueta: null,
    variable_precio_unitario: null,
    dias_entrega: null,
    orden: 1,
    activo: true,
    creado_en: '2026-01-01',
    ...p,
  }
}

const doctores = [
  { id: 'd1', nombre: 'Dra. Ruiz', consultorio_id: 'c1', consultorio_nombre: 'Sonrisa' },
]

function campoFecha(): HTMLInputElement {
  return document.querySelector('input[name="fecha_entrega"]') as HTMLInputElement
}

/**
 * Elige un tipo abriendo la hoja.
 *
 * Acotado al diálogo a propósito: una vez elegido, el botón selector del
 * formulario muestra el mismo nombre que la opción de la hoja, y una búsqueda
 * global encontraría los dos.
 */
async function elegirTipo(usuario: ReturnType<typeof userEvent.setup>, nombre: RegExp) {
  await usuario.click(screen.getAllByRole('button', { name: /elegir tipo de trabajo|corona/i })[0]!)
  const hoja = screen.getByRole('dialog')
  await usuario.click(within(hoja).getByRole('button', { name: nombre }))
}

function trabajoExistente(p: Partial<TrabajoDetalle> = {}): TrabajoDetalle {
  return {
    id: 'tr1',
    doctor_id: 'd1',
    doctor_nombre: 'Dra. Ruiz',
    consultorio_nombre: 'Sonrisa',
    tipo_nombre: 'Corona porcelana',
    categoria: 'Fija',
    paciente_nombre: null,
    fecha_ingreso: INGRESO,
    fecha_entrega: null,
    estado: 'en_curso',
    precio_acordado: 90,
    variable_cantidad: 0,
    variable_etiqueta: null,
    notas: null,
    pieza: null,
    cantidad: 1,
    entregado_el: null,
    creado_en: INGRESO,
    abonado: 0,
    saldo: 90,
    items: [],
    etapas: [],
    ...p,
  } as TrabajoDetalle
}

describe('TrabajoForm — fecha de entrega en un alta', () => {
  it('al elegir un tipo con plazo, la fecha se llena sola', async () => {
    const usuario = userEvent.setup()
    render(
      <TrabajoForm
        action={accion}
        doctores={doctores}
        tipos={[tipo({ dias_entrega: 3 })]}
        submitLabel="Crear"
        fechaIngreso={INGRESO}
      />,
    )

    expect(campoFecha().value).toBe('')

    await elegirTipo(usuario, /corona porcelana/i)

    expect(campoFecha().value).toBe('2026-09-13')
  })

  /*
    Un tipo sin plazo no inventa fecha. Es la mitad del catálogo actual, y
    rellenarla con un valor por defecto sería prometerle al consultorio algo que
    el laboratorio nunca dijo.
  */
  it('un tipo sin plazo deja la fecha vacía', async () => {
    const usuario = userEvent.setup()
    render(
      <TrabajoForm
        action={accion}
        doctores={doctores}
        tipos={[tipo({ dias_entrega: null })]}
        submitLabel="Crear"
        fechaIngreso={INGRESO}
      />,
    )

    await elegirTipo(usuario, /corona porcelana/i)

    expect(campoFecha().value).toBe('')
  })

  it('los atajos cuentan desde el ingreso', async () => {
    const usuario = userEvent.setup()
    render(
      <TrabajoForm
        action={accion}
        doctores={doctores}
        tipos={[tipo({})]}
        submitLabel="Crear"
        fechaIngreso={INGRESO}
      />,
    )

    await usuario.click(screen.getByRole('button', { name: 'Mañana' }))
    expect(campoFecha().value).toBe('2026-09-11')

    await usuario.click(screen.getByRole('button', { name: '1 semana' }))
    expect(campoFecha().value).toBe('2026-09-17')
  })

  it('se puede quitar la fecha, y el tipo no la vuelve a poner', async () => {
    const usuario = userEvent.setup()
    render(
      <TrabajoForm
        action={accion}
        doctores={doctores}
        tipos={[tipo({ dias_entrega: 3 })]}
        submitLabel="Crear"
        fechaIngreso={INGRESO}
      />,
    )

    await elegirTipo(usuario, /corona porcelana/i)
    expect(campoFecha().value).toBe('2026-09-13')

    await usuario.click(screen.getByRole('button', { name: /quitar fecha/i }))
    expect(campoFecha().value).toBe('')

    /*
      Volver a tocar el tipo no debe resucitar la fecha que se acaba de quitar:
      quitarla es una decisión, y el sistema no puede desautorizarla.
    */
    await elegirTipo(usuario, /corona porcelana/i)
    expect(campoFecha().value).toBe('')
  })

  it('muestra de dónde sale el plazo', async () => {
    const usuario = userEvent.setup()
    const { container } = render(
      <TrabajoForm
        action={accion}
        doctores={doctores}
        tipos={[tipo({ dias_entrega: 3 })]}
        submitLabel="Crear"
        fechaIngreso={INGRESO}
      />,
    )

    await elegirTipo(usuario, /corona porcelana/i)

    expect(container.textContent).toContain('del catálogo: 3 días')
  })
})

describe('TrabajoForm — fecha de entrega al editar', () => {
  /*
    La regla que protege los 30 trabajos en curso: abrir el formulario para
    cambiar el precio o el paciente no puede asignar una fecha de entrega de
    paso. Eso guardaría una promesa al consultorio que nadie hizo.
  */
  it('un trabajo sin fecha no recibe una sola por abrir el formulario', () => {
    render(
      <TrabajoForm
        action={accion}
        doctores={doctores}
        tipos={[tipo({ dias_entrega: 3 })]}
        trabajo={trabajoExistente({ fecha_entrega: null })}
        submitLabel="Guardar"
        fechaIngreso={INGRESO}
      />,
    )

    expect(campoFecha().value).toBe('')
  })

  it('respeta la fecha que ya tenía', () => {
    render(
      <TrabajoForm
        action={accion}
        doctores={doctores}
        tipos={[tipo({ dias_entrega: 3 })]}
        trabajo={trabajoExistente({ fecha_entrega: '2026-09-30' })}
        submitLabel="Guardar"
        fechaIngreso={INGRESO}
      />,
    )

    expect(campoFecha().value).toBe('2026-09-30')
  })

  it('pero sí se le puede poner una a mano', async () => {
    const usuario = userEvent.setup()
    render(
      <TrabajoForm
        action={accion}
        doctores={doctores}
        tipos={[tipo({ dias_entrega: 3 })]}
        trabajo={trabajoExistente({ fecha_entrega: null })}
        submitLabel="Guardar"
        fechaIngreso={INGRESO}
      />,
    )

    await usuario.click(screen.getByRole('button', { name: '3 días' }))
    expect(campoFecha().value).toBe('2026-09-13')
  })
})
