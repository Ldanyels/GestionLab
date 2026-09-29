import { describe, it, expect, beforeAll } from 'vitest'
import { PDFDocument, StandardFonts, type PDFFont } from 'pdf-lib'
import { truncar } from './util'

let fuente: PDFFont

beforeAll(async () => {
  const doc = await PDFDocument.create()
  fuente = await doc.embedFont(StandardFonts.Helvetica)
})

describe('truncar', () => {
  it('deja intacto lo que cabe', () => {
    expect(truncar(fuente, 'Corona', 8, 200)).toBe('Corona')
  })

  it('recorta con puntos suspensivos lo que no cabe', () => {
    const r = truncar(fuente, 'Corona porcelana veneer sobre implante', 8, 40)
    expect(r.endsWith('…')).toBe(true)
    expect(fuente.widthOfTextAtSize(r, 8)).toBeLessThanOrEqual(40)
  })

  /*
    Esta es la razón de que `truncar` sanee antes de medir.

    Las fuentes estándar del PDF solo codifican WinAnsi y `widthOfTextAtSize`
    **lanza** con cualquier otra cosa. Medir sin sanear tiraba el documento
    entero por un carácter suelto —una flecha, un emoji, un nombre en otro
    alfabeto— y el reporte dejaba de generarse sin que nadie supiera por qué.
  */
  it('no revienta con caracteres que la fuente no codifica', () => {
    expect(() => truncar(fuente, '2026-09-13 → 09-18', 8, 200)).not.toThrow()
    expect(() => truncar(fuente, 'Paciente 🦷 Pérez', 8, 200)).not.toThrow()
    expect(() => truncar(fuente, '田中さん', 8, 200)).not.toThrow()
  })

  it('los reemplaza en vez de perderlos', () => {
    expect(truncar(fuente, '2026-09-13 → 09-18', 8, 200)).toBe('2026-09-13 ? 09-18')
  })

  /*
    Medir bien un texto saneado importa: si se midiera el original y se pintara
    el saneado, el recorte saldría con el ancho equivocado.
  */
  it('mide lo saneado, no lo que llegó', () => {
    const r = truncar(fuente, '🦷🦷🦷🦷🦷🦷🦷🦷🦷🦷🦷🦷🦷🦷🦷🦷', 8, 30)
    expect(fuente.widthOfTextAtSize(r, 8)).toBeLessThanOrEqual(30)
  })

  it('con los acentos del castellano no toca nada', () => {
    expect(truncar(fuente, 'Odontología Miraflores', 8, 300)).toBe('Odontología Miraflores')
  })
})
