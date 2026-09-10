import { describe, it, expect } from 'vitest'
import {
  ETIQUETA_DOC,
  TIPOS_DOC,
  datosFacturacionSchema,
  descripcionFiscal,
  tieneDatosFacturacion,
} from './documento'

const valido = {
  doc_tipo: 'RUC' as const,
  doc_numero: '15612020377',
  razon_social: 'Laboratorio Dental MasterLab E.I.R.L.',
  direccion_fiscal: 'Av. Perú 123, San Martín de Porres',
}

describe('datosFacturacionSchema', () => {
  it('acepta un RUC de once dígitos', () => {
    expect(datosFacturacionSchema.safeParse(valido).success).toBe(true)
  })

  it('rechaza un RUC que no tenga once dígitos', () => {
    for (const n of ['1561202037', '156120203771', '1561202037a']) {
      const r = datosFacturacionSchema.safeParse({ ...valido, doc_numero: n })
      expect(r.success, n).toBe(false)
      if (!r.success) expect(r.error.issues[0]?.message).toBe('El RUC son 11 dígitos')
    }
  })

  // No todos los clientes tienen RUC: un técnico dental independiente puede
  // recibir boleta con su DNI.
  it('acepta un DNI de ocho dígitos', () => {
    const r = datosFacturacionSchema.safeParse({
      ...valido,
      doc_tipo: 'DNI',
      doc_numero: '45678912',
    })
    expect(r.success).toBe(true)
  })

  it('rechaza un DNI que no tenga ocho dígitos', () => {
    const r = datosFacturacionSchema.safeParse({
      ...valido,
      doc_tipo: 'DNI',
      doc_numero: '4567891',
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('El DNI son 8 dígitos')
  })

  // El carné de extranjería no tiene una longitud única, y hay clientes
  // extranjeros: se valida el rango en vez de un número exacto.
  it('acepta un carné de extranjería', () => {
    const r = datosFacturacionSchema.safeParse({
      ...valido,
      doc_tipo: 'CE',
      doc_numero: '003412216',
    })
    expect(r.success).toBe(true)
  })

  it('exige el nombre o la razón social', () => {
    const r = datosFacturacionSchema.safeParse({ ...valido, razon_social: '  ' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.issues[0]?.message).toBe('El nombre o razón social es obligatorio')
  })

  // La boleta no exige dirección; la factura sí. Se pide pero no se obliga.
  it('la dirección es opcional', () => {
    const r = datosFacturacionSchema.parse({ ...valido, direccion_fiscal: '' })
    expect(r.direccion_fiscal).toBeNull()
  })

  it('recorta los espacios y quita los guiones del número', () => {
    const r = datosFacturacionSchema.parse({
      ...valido,
      doc_numero: ' 1561-2020-377 ',
      razon_social: '  MasterLab  ',
    })
    expect(r.doc_numero).toBe('15612020377')
    expect(r.razon_social).toBe('MasterLab')
  })

  it('rechaza un tipo de documento inventado', () => {
    expect(
      datosFacturacionSchema.safeParse({ ...valido, doc_tipo: 'PASAPORTE' }).success,
    ).toBe(false)
  })
})

describe('tieneDatosFacturacion', () => {
  it('hacen falta el tipo, el número y el nombre', () => {
    expect(tieneDatosFacturacion(valido)).toBe(true)
    expect(tieneDatosFacturacion({ ...valido, doc_numero: null })).toBe(false)
    expect(tieneDatosFacturacion({ ...valido, razon_social: null })).toBe(false)
    expect(tieneDatosFacturacion({})).toBe(false)
  })
})

describe('descripcionFiscal', () => {
  it('resume el documento en una línea', () => {
    expect(descripcionFiscal(valido)).toBe(
      'Laboratorio Dental MasterLab E.I.R.L. · RUC 15612020377',
    )
  })

  // Lo que se ve cuando el laboratorio se dio de alta antes de que existieran
  // estos campos, como MasterLab.
  it('lo dice cuando no hay datos, en vez de mostrar una línea a medias', () => {
    expect(descripcionFiscal({})).toBe('Sin datos de facturación')
  })
})

describe('ETIQUETA_DOC', () => {
  it('nombra cada tipo', () => {
    for (const t of TIPOS_DOC) expect(ETIQUETA_DOC[t]).toBeTruthy()
  })
})
