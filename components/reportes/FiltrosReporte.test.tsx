import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FiltrosReporte } from './FiltrosReporte'
import { resolverFiltros } from '@/lib/reportes/filtros'

const opciones = {
  consultorios: [{ id: 'c1', nombre: 'Arte oral' }],
  doctores: [{ id: 'd1', nombre: 'Dr. Pérez', consultorio_id: 'c1' }],
}
const conteoPago = { cualquiera: 20, por_cobrar: 18, pagados: 2 }
const conteoEstado = { todos: 20, en_curso: 7, cerrado: 1, entregado: 12 }

function pintar(sp = {}, montos = true) {
  return render(
    <FiltrosReporte
      filtros={resolverFiltros(sp)}
      conteoEstado={conteoEstado}
      conteoPago={conteoPago}
      montos={montos}
      {...opciones}
    />,
  )
}

describe('FiltrosReporte — estado', () => {
  it('ofrece los cuatro estados como un solo grupo, con su conteo', () => {
    pintar()
    expect(screen.getByRole('group', { name: 'Estado del trabajo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Entregados/ })).toHaveTextContent('12')
  })

  it('marca el estado vigente', () => {
    pintar({ estado: 'entregado' })
    expect(screen.getByRole('link', { name: /Entregados/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})

describe('FiltrosReporte — fecha', () => {
  it('rotula la tira como fecha de ingreso por defecto', () => {
    pintar()
    expect(screen.getByRole('navigation', { name: /fecha de ingreso/i })).toBeInTheDocument()
  })


  it('el mes es el periodo por defecto y aparece marcado', () => {
    pintar()
    expect(screen.getByRole('link', { name: 'Este mes' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('el rango a medida solo despliega sus campos cuando está elegido', () => {
    pintar()
    expect(screen.queryByLabelText('Desde')).toBeNull()
    pintar({ periodo: 'rango', desde: '2026-08-01', hasta: '2026-08-31' })
    expect(screen.getByLabelText('Desde')).toHaveValue('2026-08-01')
  })
})

describe('FiltrosReporte — cobro', () => {
  it('ofrece las dos fichas de cobro con su conteo', () => {
    pintar()
    expect(screen.getByRole('link', { name: /Por cobrar/ })).toHaveTextContent('18')
    expect(screen.getByRole('link', { name: /Pagados/ })).toHaveTextContent('2')
  })

  // Sin permiso de importes la pantalla no muestra un solo monto, así que
  // «por cobrar» y «pagados» no significan nada ahí.
  it('sin permiso de importes no aparecen', () => {
    pintar({}, false)
    expect(screen.queryByRole('link', { name: /Por cobrar/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /Pagados/ })).toBeNull()
  })
})

describe('FiltrosReporte — consultorio y doctor', () => {
  it('mantiene las listas de consultorio y doctor', () => {
    pintar()
    expect(screen.getByLabelText('Consultorio')).toBeInTheDocument()
    expect(screen.getByLabelText('Doctor')).toBeInTheDocument()
  })

  // El filtro se aplica al tocarlo, como en Trabajos.
  it('ya no hay botón de aplicar', () => {
    pintar()
    expect(screen.queryByRole('button', { name: /ver reporte/i })).toBeNull()
  })
})
