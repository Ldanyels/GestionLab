import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { DOCUMENTOS_LEGALES } from './textos.generated'

const ARCHIVOS: Record<string, string> = {
  terminos: 'docs/legal/terminos-del-servicio.md',
  privacidad: 'docs/legal/politica-de-privacidad.md',
  encargo: 'docs/legal/contrato-de-encargo-de-tratamiento.md',
}

describe('documentos legales sellados', () => {
  it('están los tres', () => {
    expect(DOCUMENTOS_LEGALES.map((d) => d.clave)).toEqual([
      'terminos',
      'privacidad',
      'encargo',
    ])
  })

  /*
    La prueba que sostiene todo el valor probatorio: si alguien edita un
    markdown y no vuelve a sellar, el hash guardado deja de corresponder al
    texto que la gente lee. Entonces el registro de una aceptación afirma algo
    que no se puede demostrar, y no habría ninguna señal de que pasó.
  */
  it('la huella corresponde al markdown de hoy', () => {
    for (const doc of DOCUMENTOS_LEGALES) {
      const markdown = readFileSync(ARCHIVOS[doc.clave], 'utf8')
      const hash = createHash('sha256').update(markdown, 'utf8').digest('hex')
      expect(hash, `${doc.clave}: ejecuta «pnpm sellar:legales»`).toBe(doc.hash)
    }
  })

  it('la versión se deriva de la huella, no se escribe a mano', () => {
    for (const doc of DOCUMENTOS_LEGALES) {
      expect(doc.version).toBe(`v-${doc.hash.slice(0, 8)}`)
    }
  })

  it('cada documento trae su texto para mostrarlo', () => {
    for (const doc of DOCUMENTOS_LEGALES) {
      expect(doc.html.length).toBeGreaterThan(500)
      expect(doc.titulo.length).toBeGreaterThan(0)
    }
  })

  it('las huellas son distintas entre documentos', () => {
    const hashes = new Set(DOCUMENTOS_LEGALES.map((d) => d.hash))
    expect(hashes.size).toBe(DOCUMENTOS_LEGALES.length)
  })
})
