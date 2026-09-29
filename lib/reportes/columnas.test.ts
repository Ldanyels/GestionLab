import { describe, it, expect } from 'vitest'
import {
  celdasDeFila,
  celdasDeSubtotal,
  columnasReporte,
  tieneDeuda,
  UTIL_APAISADO,
  xDeColumnas,
} from './columnas'
import type { FilaReporte } from './agrupar'
import { formatMoney } from '@/lib/format'

const MARGEN = 40

function fila(p: Partial<FilaReporte> = {}): FilaReporte {
  return {
    id: 't1',
    fecha_ingreso: '2026-09-13',
    entregado_el: null,
    estado: 'en_curso',
    paciente: 'Juan Pérez',
    resumen: 'Corona porcelana',
    total: 260,
    pagado: 100,
    doctor_id: 'd1',
    doctor: 'Dra. Ruiz',
    consultorio_id: 'c1',
    consultorio: 'Sonrisa Dental',
    ...p,
  }
}

describe('columnasReporte', () => {
  /*
    Si la suma se pasa del ancho útil, las últimas columnas se pintan fuera del
    papel: el saldo, que es el dato por el que existe el reporte, saldría
    cortado por el borde. La prueba fija el límite antes que el papel.
  */
  it('con importes, las columnas caben en el ancho útil', () => {
    const suma = columnasReporte(true).reduce((s, c) => s + c.ancho, 0)
    expect(suma).toBeLessThanOrEqual(UTIL_APAISADO)
  })

  it('sin importes, también caben', () => {
    const suma = columnasReporte(false).reduce((s, c) => s + c.ancho, 0)
    expect(suma).toBeLessThanOrEqual(UTIL_APAISADO)
  })

  it('sin importes desaparecen las columnas de dinero', () => {
    const claves = columnasReporte(false).map((c) => c.clave)
    expect(claves).not.toContain('total')
    expect(claves).not.toContain('abono')
  })

  /*
    La lista y el orden los fijó el laboratorio. La prueba los deja escritos
    para que no se cuele una columna de vuelta sin que nadie lo decida.
  */
  it('son las columnas que pidió el laboratorio, en su orden', () => {
    expect(columnasReporte(true).map((c) => c.titulo)).toEqual([
      'Consultorio',
      'Doctor',
      'Entrega',
      'Paciente',
      'Abono',
      'Tratamientos',
      'Total',
    ])
  })

  it('ya no hay columna de ingreso ni de estado', () => {
    const claves = columnasReporte(true).map((c) => c.clave)
    expect(claves).not.toContain('ingreso')
    expect(claves).not.toContain('estado')
  })

  it('las cifras van a la derecha y los nombres no', () => {
    const cols = columnasReporte(true)
    expect(cols.find((c) => c.clave === 'total')?.derecha).toBe(true)
    expect(cols.find((c) => c.clave === 'abono')?.derecha).toBe(true)
    expect(cols.find((c) => c.clave === 'consultorio')?.derecha).toBeUndefined()
  })
})

describe('xDeColumnas', () => {
  it('la primera empieza en el margen', () => {
    const cols = columnasReporte(true)
    expect(xDeColumnas(cols, MARGEN)[0]).toBe(MARGEN)
  })

  it('cada columna empieza donde acaba la anterior', () => {
    const cols = [
      { clave: 'a', titulo: 'A', ancho: 100 },
      { clave: 'b', titulo: 'B', ancho: 50 },
      { clave: 'c', titulo: 'C', ancho: 30 },
    ]
    expect(xDeColumnas(cols, MARGEN)).toEqual([40, 140, 190])
  })

  /*
    Una columna alineada a la derecha necesita su borde derecho, no el
    izquierdo: es de donde se resta el ancho del texto al pintarlo.
  */
  it('una columna a la derecha devuelve su borde derecho', () => {
    const cols = [
      { clave: 'a', titulo: 'A', ancho: 100 },
      { clave: 'b', titulo: 'B', ancho: 50, derecha: true },
    ]
    expect(xDeColumnas(cols, MARGEN)).toEqual([40, 190])
  })

  it('ninguna columna se sale del papel', () => {
    const cols = columnasReporte(true)
    const xs = xDeColumnas(cols, MARGEN)
    for (const x of xs) expect(x).toBeLessThanOrEqual(MARGEN + UTIL_APAISADO)
  })
})

describe('celdasDeFila', () => {
  it('devuelve una celda por columna, en orden', () => {
    const cols = columnasReporte(true)
    const celdas = celdasDeFila(fila(), cols)
    expect(celdas).toHaveLength(cols.length)
    expect(celdas[0]).toBe('Sonrisa Dental')
    expect(celdas[1]).toBe('Dra. Ruiz')
    expect(celdas[5]).toBe('Corona porcelana')
  })

  it('el abono es lo ya cobrado y el total lo que cuesta', () => {
    const cols = columnasReporte(true)
    const celdas = celdasDeFila(fila({ total: 260, pagado: 100 }), cols)
    expect(celdas[4]).toBe(formatMoney(100))
    expect(celdas[6]).toBe(formatMoney(260))
  })

  /*
    Una celda en blanco en una matriz impresa se lee como un fallo de la
    exportación. El guion dice que el dato no existe.
  */
  it('sin paciente pone un guion, no un hueco', () => {
    const cols = columnasReporte(true)
    expect(celdasDeFila(fila({ paciente: null }), cols)[3]).toBe('—')
  })

  it('sin entregar, la columna de entrega lleva guion', () => {
    const cols = columnasReporte(true)
    expect(celdasDeFila(fila({ entregado_el: null }), cols)[2]).toBe('—')
  })

  it('entregado muestra su fecha real', () => {
    const cols = columnasReporte(true)
    const celdas = celdasDeFila(fila({ estado: 'entregado', entregado_el: '2026-09-18' }), cols)
    expect(celdas[2]).toBe('2026-09-18')
  })

  it('sin importes no devuelve celdas de dinero', () => {
    const cols = columnasReporte(false)
    const celdas = celdasDeFila(fila(), cols)
    expect(celdas).toHaveLength(5)
    expect(celdas.join(' ')).not.toContain('260')
  })
})

describe('tieneDeuda', () => {
  /*
    Sin columna de saldo, esto es lo que decide qué se pinta en rojo: un reporte
    de cobranza sin señal de quién debe obliga a restar setenta filas a mano.
  */
  it('hay deuda cuando lo abonado no llega al total', () => {
    expect(tieneDeuda(fila({ total: 260, pagado: 100 }))).toBe(true)
  })

  it('no hay deuda cuando está pagado del todo', () => {
    expect(tieneDeuda(fila({ total: 260, pagado: 260 }))).toBe(false)
  })

  /* Los céntimos en coma flotante: 33.33 * 3 no da exactamente 99.99. */
  it('una diferencia menor a un céntimo no es deuda', () => {
    expect(tieneDeuda(fila({ total: 99.99, pagado: 33.33 * 3 }))).toBe(false)
  })
})

describe('celdasDeSubtotal', () => {
  /*
    El reporte se usa para cobrar: sin el subtotal por consultorio habría que
    sumar a mano la única cifra que se le pide a este papel.
  */
  it('pone las cifras del grupo bajo sus columnas', () => {
    const cols = columnasReporte(true)
    const celdas = celdasDeSubtotal(
      { consultorio: 'Sonrisa Dental', facturado: 890, pagado: 340 },
      3,
      cols,
    )
    expect(celdas[0]).toBe('Sonrisa Dental')
    // El hueco del doctor queda libre para que el nombre pueda ocuparlo.
    expect(celdas[1]).toBe('')
    expect(celdas[3]).toBe('3 trabajos')
    expect(celdas[4]).toBe(formatMoney(340))
    expect(celdas[6]).toBe(formatMoney(890))
  })

  it('un solo trabajo se dice en singular', () => {
    const cols = columnasReporte(true)
    const celdas = celdasDeSubtotal(
      { consultorio: 'Sonrisa Dental', facturado: 260, pagado: 0 },
      1,
      cols,
    )
    expect(celdas[3]).toBe('1 trabajo')
  })
})
