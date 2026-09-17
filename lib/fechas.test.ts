import { describe, it, expect } from 'vitest'
import { diaMes, diasEntre, diasDelMes, sumarDias, sumarMeses } from './fechas'

describe('diaMes', () => {
  it('da el día y el mes', () => {
    expect(diaMes('2026-09-17')).toBe('17/09')
  })

  it('conserva los ceros a la izquierda', () => {
    expect(diaMes('2026-01-05')).toBe('05/01')
  })

  /*
    Acepta una marca de tiempo completa y no solo la fecha: `creado_en` viene
    con hora, y recortarla en cada sitio que la muestre sería una ocasión más de
    olvidarlo.
  */
  it('acepta una fecha con hora', () => {
    expect(diaMes('2026-09-17T10:30:00.000Z')).toBe('17/09')
  })
})

describe('sumarDias', () => {
  it('suma y resta', () => {
    expect(sumarDias('2026-09-17', 3)).toBe('2026-09-20')
    expect(sumarDias('2026-09-17', -3)).toBe('2026-09-14')
  })

  it('cruza el fin de mes y el de año', () => {
    expect(sumarDias('2026-09-30', 1)).toBe('2026-10-01')
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('cuenta el 29 de febrero en año bisiesto', () => {
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29')
    expect(sumarDias('2026-02-28', 1)).toBe('2026-03-01')
  })
})

describe('sumarMeses', () => {
  /*
    El 31 de enero más un mes es el 28 de febrero, no el 3 de marzo. Sin el
    recorte la fecha se desborda al mes siguiente, y los periodos de cobro de un
    laboratorio que empezó un día 31 se irían corriendo solos.
  */
  it('recorta al último día cuando el día no existe', () => {
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28')
    expect(sumarMeses('2028-01-31', 1)).toBe('2028-02-29')
  })

  it('suma meses normales', () => {
    expect(sumarMeses('2026-09-15', 1)).toBe('2026-10-15')
    expect(sumarMeses('2026-12-15', 1)).toBe('2027-01-15')
  })
})

describe('diasEntre', () => {
  it('cuenta los días entre dos fechas', () => {
    expect(diasEntre('2026-09-10', '2026-09-17')).toBe(7)
  })

  it('da negativo si la segunda es anterior', () => {
    expect(diasEntre('2026-09-17', '2026-09-10')).toBe(-7)
  })

  /*
    En UTC, no en la zona del servidor: si dependiera de dónde se ejecuta, el
    mismo par de fechas daría un día más o menos según la región de Vercel que
    atendiera la petición.
  */
  it('no se descuadra al cruzar un cambio de hora', () => {
    expect(diasEntre('2026-04-01', '2026-04-02')).toBe(1)
    expect(diasEntre('2026-10-31', '2026-11-01')).toBe(1)
  })
})

describe('diasDelMes', () => {
  it('conoce los meses de 30 y 31', () => {
    expect(diasDelMes(2026, 9)).toBe(30)
    expect(diasDelMes(2026, 10)).toBe(31)
  })

  it('conoce febrero, con y sin bisiesto', () => {
    expect(diasDelMes(2026, 2)).toBe(28)
    expect(diasDelMes(2028, 2)).toBe(29)
  })
})
