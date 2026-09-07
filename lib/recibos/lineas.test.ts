import { describe, it, expect } from 'vitest'
import { lineasRecibo, textoSeguro, type ReciboDatos } from './lineas'

const base: ReciboDatos = {
  laboratorio: 'MasterLab',
  fecha: '07/09/2026 10:30',
  doctor: 'Dr. Pérez',
  consultorio: 'Clínica Sonrisa',
  paciente: 'Juan Díaz',
  pieza: '11, 21',
  tipo: 'Corona metal cerámica',
  cantidad: 2,
  precioTotal: 360,
  abonos: [
    { fecha: '2026-09-01', metodo: 'efectivo', monto: 100 },
    { fecha: '2026-09-05', metodo: 'yape/plin', monto: 60 },
  ],
}

function textos(datos: ReciboDatos): string {
  return lineasRecibo(datos)
    .map((l) => `${l.izq}${l.der ? ` | ${l.der}` : ''}`)
    .join('\n')
}

describe('lineasRecibo', () => {
  it('incluye encabezado, detalle y totales', () => {
    const t = textos(base)
    expect(t).toContain('MasterLab')
    expect(t).toContain('2 × Corona metal cerámica')
    expect(t).toContain('Total | S/ 360.00')
    expect(t).toContain('Pagado | S/ 160.00')
    expect(t).toContain('Saldo | S/ 200.00')
  })

  it('muestra abonos con fecha legible', () => {
    const t = textos(base)
    expect(t).toContain('01/09/2026')
    expect(t).toContain('S/ 100.00')
  })

  it('sin cantidad múltiple no antepone el multiplicador', () => {
    const t = textos({ ...base, cantidad: 1 })
    expect(t).not.toContain('1 ×')
    expect(t).toContain('Corona metal cerámica')
  })

  it('omite paciente y pieza cuando no existen', () => {
    const t = textos({ ...base, paciente: null, pieza: null })
    expect(t).not.toContain('Paciente')
    expect(t).not.toContain('Pieza')
  })

  it('sin abonos no lista pagos pero sí el saldo completo', () => {
    const t = textos({ ...base, abonos: [] })
    expect(t).toContain('Saldo | S/ 360.00')
    expect(t).not.toContain('Abonos')
  })
})

describe('textoSeguro', () => {
  it('conserva español y símbolos del recibo', () => {
    expect(textoSeguro('¡Gracias! · 2 × Corona… S/ 360')).toBe(
      '¡Gracias! · 2 × Corona… S/ 360',
    )
    expect(textoSeguro('Pérez Ñañez')).toBe('Pérez Ñañez')
  })

  it('reemplaza emoji y caracteres no Latin-1 por "?"', () => {
    expect(textoSeguro('Juan 😀')).toBe('Juan ?')
    expect(textoSeguro('診療所')).toBe('???')
  })

  it('convierte saltos de línea y controles en espacios', () => {
    expect(textoSeguro('a\nb\tc')).toBe('a b c')
  })
})
