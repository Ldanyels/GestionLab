import { describe, it, expect } from 'vitest'
import { lineasRecibo, textoSeguro, type ReciboDatos } from './lineas'

const base: ReciboDatos = {
  laboratorio: 'MasterLab',
  fecha: '07/09/2026 10:30',
  doctor: 'Dr. Pérez',
  consultorio: 'Clínica Sonrisa',
  paciente: 'Juan Díaz',
  items: [
    { nombre: 'Corona metal cerámica', cantidad: 2, subtotal: 360, pieza: '11, 21' },
    { nombre: 'Férula de descarga', cantidad: 1, subtotal: 150 },
  ],
  precioTotal: 510,
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
  it('incluye encabezado, cada línea de trabajo y totales', () => {
    const t = textos(base)
    expect(t).toContain('MasterLab')
    expect(t).toContain('2 × Corona metal cerámica (pza 11, 21) | S/ 360.00')
    expect(t).toContain('Férula de descarga | S/ 150.00')
    expect(t).toContain('Total | S/ 510.00')
    expect(t).toContain('Pagado | S/ 160.00')
    expect(t).toContain('Saldo | S/ 350.00')
  })

  it('muestra abonos con fecha legible', () => {
    const t = textos(base)
    expect(t).toContain('01/09/2026')
    expect(t).toContain('S/ 100.00')
  })

  it('cantidad 1 no antepone el multiplicador', () => {
    const t = textos(base)
    expect(t).not.toContain('1 × Férula')
  })

  it('omite paciente cuando no existe', () => {
    const t = textos({ ...base, paciente: null })
    expect(t).not.toContain('Paciente')
  })

  it('sin abonos no lista pagos pero sí el saldo completo', () => {
    const t = textos({ ...base, abonos: [] })
    expect(t).toContain('Saldo | S/ 510.00')
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
