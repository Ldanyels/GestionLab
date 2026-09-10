import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CobranzaLaboratorio } from './CobranzaLaboratorio'
import { laboratorioDePrueba } from '@/lib/plataforma/__fixtures__/laboratorio'
import type { Cuota } from '@/lib/cuotas/data'

const nada = vi.fn(async () => {})

const cuota = (p: Partial<Cuota> = {}): Cuota => ({
  id: 'c1',
  laboratorio_id: 'l1',
  periodo_inicio: '2026-09-01',
  periodo_fin: '2026-09-30',
  emitida_el: '2026-09-01',
  vence_el: '2026-09-16',
  monto: 250,
  estado: 'pendiente',
  pagada_el: null,
  medio_pago: null,
  comprobante: null,
  nota: null,
  ...p,
})

function pintar(lab = laboratorioDePrueba(), cuotas: Cuota[] = []) {
  return render(
    <CobranzaLaboratorio
      lab={lab}
      cuotas={cuotas}
      hoy="2026-09-25"
      guardarCondiciones={nada}
      marcarPagada={nada}
      anular={nada}
    />,
  )
}

const PAGADO = laboratorioDePrueba({
  plan: 'pagado',
  periodicidad: 'mensual',
  precio_cuota: 250,
  inicio_cobro: '2026-09-01',
})

describe('CobranzaLaboratorio — condiciones', () => {
  it('trae las condiciones actuales para corregirlas', () => {
    pintar(PAGADO)
    expect(screen.getByLabelText('Plan')).toHaveValue('pagado')
    expect(screen.getByLabelText('Periodicidad')).toHaveValue('mensual')
    expect(screen.getByLabelText('Precio')).toHaveValue(250)
    expect(screen.getByLabelText('Inicio de cobro')).toHaveValue('2026-09-01')
  })

  /*
    MasterLab es cliente fundador sin costo. Decirlo en la ficha evita que
    alguien mire la lista de cuotas vacía y crea que el sistema falló.
  */
  it('en cortesía lo dice, en vez de mostrar una lista vacía sin más', () => {
    const { container } = pintar(laboratorioDePrueba({ plan: 'gratis' }))
    // «Cortesía» también es una opción del selector de plan, así que se busca
    // la frase del aviso y no la palabra suelta.
    expect(container.textContent).toMatch(/no se le genera ninguna cuota/i)
  })
})

describe('CobranzaLaboratorio — cuotas', () => {
  it('lista cada cuota con su periodo y monto', () => {
    pintar(PAGADO, [cuota()])
    expect(screen.getByText(/2026-09-01 → 2026-09-30/)).toBeInTheDocument()
    expect(screen.getByText('S/ 250.00')).toBeInTheDocument()
  })

  // Es el dato que dice a quién hay que llamar hoy.
  it('marca los días de mora de una cuota vencida', () => {
    pintar(PAGADO, [cuota({ vence_el: '2026-09-16' })])
    expect(screen.getByText(/9 días/)).toBeInTheDocument()
  })

  it('una cuota que aún no vence no aparece en mora', () => {
    pintar(PAGADO, [cuota({ vence_el: '2026-10-16' })])
    expect(screen.queryByText(/días/)).toBeNull()
  })

  it('una pagada muestra cuándo y con qué', () => {
    pintar(PAGADO, [
      cuota({ estado: 'pagada', pagada_el: '2026-09-12', medio_pago: 'yape/plin' }),
    ])
    expect(screen.getByText(/2026-09-12/)).toBeInTheDocument()
    expect(screen.getByText(/yape\/plin/)).toBeInTheDocument()
  })

  it('ofrece marcar pagada lo que está pendiente', () => {
    pintar(PAGADO, [cuota()])
    expect(screen.getByRole('button', { name: /marcar pagada/i })).toBeInTheDocument()
  })

  it('no lo ofrece en una cuota ya pagada', () => {
    pintar(PAGADO, [cuota({ estado: 'pagada', pagada_el: '2026-09-12' })])
    expect(screen.queryByRole('button', { name: /marcar pagada/i })).toBeNull()
  })

  // Una anulada no es deuda ni ingreso: se emitió mal y hay que poder verlo.
  it('distingue una cuota anulada y dice por qué', () => {
    const { container } = pintar(PAGADO, [cuota({ estado: 'anulada', nota: 'duplicada' })])
    expect(container.textContent).toMatch(/Anulada · duplicada/)
    // Y no ofrece cobrarla.
    expect(screen.queryByRole('button', { name: /marcar pagada/i })).toBeNull()
  })

  it('sin cuotas lo dice', () => {
    pintar(PAGADO, [])
    expect(screen.getByText(/sin cuotas/i)).toBeInTheDocument()
  })
})
