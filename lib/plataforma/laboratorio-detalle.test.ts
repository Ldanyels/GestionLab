import { describe, it, expect } from 'vitest'
import {
  aTrabajoDePlataforma,
  COLUMNAS_TRABAJO,
  porCobrarDe,
  ultimoIngresoDe,
} from './laboratorio-detalle'

const cruda = {
  id: 't1',
  fecha_ingreso: '2026-09-01',
  entregado_el: null,
  estado: 'en_curso' as const,
  precio_acordado: 360,
  doctor: { nombre: 'Dr. Pérez', consultorio: { nombre: 'Arte oral' } },
  catalogo: { nombre: 'Corona porcelana' },
  abonos: [{ monto: 100 }, { monto: 60 }],
}

describe('COLUMNAS_TRABAJO', () => {
  // La regla del sub-proyecto: el nombre del paciente no se trae. Un campo que
  // no viaja no se filtra por accidente en un registro de errores.
  it('no pide el nombre del paciente', () => {
    expect(COLUMNAS_TRABAJO).not.toMatch(/paciente/i)
  })

  it('pide lo que la ficha necesita para identificar un trabajo', () => {
    for (const c of ['estado', 'precio_acordado', 'fecha_ingreso', 'entregado_el']) {
      expect(COLUMNAS_TRABAJO).toContain(c)
    }
  })
})

describe('aTrabajoDePlataforma', () => {
  it('resuelve los nombres de tipo, doctor y consultorio', () => {
    const t = aTrabajoDePlataforma(cruda)
    expect(t.tipo_nombre).toBe('Corona porcelana')
    expect(t.doctor_nombre).toBe('Dr. Pérez')
    expect(t.consultorio_nombre).toBe('Arte oral')
  })

  it('calcula el saldo restando los abonos', () => {
    expect(aTrabajoDePlataforma(cruda).saldo).toBe(200)
  })

  it('sin abonos el saldo es el precio completo', () => {
    expect(aTrabajoDePlataforma({ ...cruda, abonos: [] }).saldo).toBe(360)
  })

  it('tolera las relaciones ausentes', () => {
    const t = aTrabajoDePlataforma({ ...cruda, doctor: null, catalogo: null, abonos: null })
    expect(t.doctor_nombre).toBe('—')
    expect(t.consultorio_nombre).toBe('—')
    expect(t.tipo_nombre).toBe('—')
    expect(t.saldo).toBe(360)
  })

  // Segunda línea de defensa: aunque una consulta futura llegara a traer el
  // campo, el mapeo no lo deja pasar a la interfaz.
  it('no devuelve el nombre del paciente aunque la fila lo traiga', () => {
    const conPaciente = { ...cruda, paciente_nombre: 'Juan Díaz' } as unknown as typeof cruda
    const t = aTrabajoDePlataforma(conPaciente)
    expect(Object.keys(t)).not.toContain('paciente_nombre')
  })
})

describe('porCobrarDe', () => {
  it('suma los saldos pendientes', () => {
    const t = [aTrabajoDePlataforma(cruda), aTrabajoDePlataforma({ ...cruda, id: 't2' })]
    expect(porCobrarDe(t)).toBe(400)
  })

  it('sin trabajos es cero', () => {
    expect(porCobrarDe([])).toBe(0)
  })
})

describe('ultimoIngresoDe', () => {
  it('devuelve la fecha de ingreso más reciente', () => {
    const t = [
      aTrabajoDePlataforma(cruda),
      aTrabajoDePlataforma({ ...cruda, id: 't2', fecha_ingreso: '2026-09-08' }),
    ]
    expect(ultimoIngresoDe(t)).toBe('2026-09-08')
  })

  it('sin trabajos no hay fecha', () => {
    expect(ultimoIngresoDe([])).toBeNull()
  })
})
