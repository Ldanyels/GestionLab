/**
 * Sella los documentos legales: calcula su huella y los deja listos para la app.
 *
 * Lee los markdown de `docs/legal/`, calcula el SHA-256 de cada uno, los
 * convierte a HTML y escribe todo en `lib/legal/textos.generated.ts`.
 *
 * ¿Por qué generar un módulo en vez de leer los archivos cuando hacen falta?
 * Porque en producción no estarían: Next solo empaqueta los archivos que
 * detecta de forma estática, y un `readFile` con ruta armada no se detecta. Un
 * módulo TypeScript viaja siempre.
 *
 * La huella es la parte que da valor probatorio. Sin ella, el registro de una
 * aceptación dice «aceptó los términos» y no puede demostrar **cuáles**: si el
 * texto cambia después, no hay forma de saber qué leyó esa persona. Con ella,
 * cambiar una coma cambia la versión, y quien ya aceptó tiene que volver a
 * hacerlo.
 *
 * Uso: pnpm sellar:legales
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { marked } from 'marked'

const DOCUMENTOS = [
  {
    clave: 'terminos',
    titulo: 'Términos del servicio',
    archivo: 'docs/legal/terminos-del-servicio.md',
  },
  {
    clave: 'privacidad',
    titulo: 'Política de privacidad',
    archivo: 'docs/legal/politica-de-privacidad.md',
  },
  {
    clave: 'encargo',
    titulo: 'Contrato de encargo de tratamiento de datos personales',
    archivo: 'docs/legal/contrato-de-encargo-de-tratamiento.md',
  },
]

const SALIDA = 'lib/legal/textos.generated.ts'

/**
 * La huella se calcula sobre el markdown, no sobre el HTML.
 *
 * El markdown es la fuente que revisa el abogado y la que se firma; el HTML es
 * una presentación que podría cambiar por un ajuste del conversor sin que el
 * contenido cambie. Sellar la presentación haría que una actualización de
 * `marked` obligara a todo el mundo a aceptar de nuevo.
 */
function huella(texto) {
  return createHash('sha256').update(texto, 'utf8').digest('hex')
}

/**
 * Versión legible derivada de la huella.
 *
 * No se usa un número que alguien tenga que acordarse de subir: la versión ES
 * el contenido. `v-3f9a1c2b` no se puede olvidar de actualizar.
 */
function version(hash) {
  return `v-${hash.slice(0, 8)}`
}

/**
 * Quita el título del propio documento.
 *
 * La pantalla de aceptación ya lo muestra en su cabecera, con la versión al
 * lado, así que dejarlo lo repetiría dos veces seguidas.
 */
function sinTituloPropio(html) {
  return html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, '')
}

const MARCA_BORRADOR = 'Borrador para revisión legal'

const sellados = DOCUMENTOS.map((d) => {
  const markdown = readFileSync(d.archivo, 'utf8')
  const hash = huella(markdown)
  return {
    ...d,
    hash,
    version: version(hash),
    html: sinTituloPropio(marked.parse(markdown, { async: false })),
    markdown,
    esBorrador: markdown.includes(MARCA_BORRADOR),
  }
})

const cabecera = `/**
 * GENERADO AUTOMÁTICAMENTE — no editar a mano.
 *
 * Lo escribe \`scripts/sellar-legales.mjs\` a partir de \`docs/legal/*.md\`.
 * Para cambiar un documento se edita el markdown y se ejecuta:
 *
 *   pnpm sellar:legales
 *
 * \`lib/legal/textos.test.ts\` falla si este archivo y los markdown se
 * desincronizan, así que no se puede olvidar.
 */
`

const cuerpo = `${cabecera}
export interface DocumentoLegal {
  clave: 'terminos' | 'privacidad' | 'encargo'
  titulo: string
  /** Versión derivada de la huella: cambiar el texto cambia la versión. */
  version: string
  /** SHA-256 del markdown original, en hexadecimal. */
  hash: string
  /** El documento en HTML, para mostrarlo. Generado desde el markdown. */
  html: string
  /**
   * Si sigue marcado como borrador para revisión legal.
   *
   * Un borrador **no se pide aceptar**: un cliente leyendo «Borrador para
   * revisión legal» en la pantalla que le bloquea el acceso sería peor que no
   * pedirle nada. Se activa solo cuando el abogado aprueba y se retira esa
   * nota, porque retirarla cambia la huella y obliga a volver a sellar.
   */
  esBorrador: boolean
}

export const DOCUMENTOS_LEGALES: readonly DocumentoLegal[] = ${JSON.stringify(
  sellados.map(({ clave, titulo, version, hash, html, esBorrador }) => ({
    clave,
    titulo,
    version,
    hash,
    html,
    esBorrador,
  })),
  null,
  2,
)} as const
`

writeFileSync(SALIDA, cuerpo, 'utf8')

console.log(`Sellados ${sellados.length} documentos en ${SALIDA}:\n`)
for (const d of sellados) {
  console.log(
    `  ${d.clave.padEnd(12)} ${d.version}  ${String(d.markdown.length).padStart(5)} caracteres` +
      (d.esBorrador ? '  <-- BORRADOR' : ''),
  )
}

const borradores = sellados.filter((d) => d.esBorrador)
if (borradores.length > 0) {
  console.log(
    `\n!  ${borradores.length} documento(s) siguen marcados como «${MARCA_BORRADOR}».\n` +
      '   La pantalla de aceptación muestra el texto TAL CUAL, así que un cliente\n' +
      '   leería que está aceptando un borrador sin revisar. No actives la\n' +
      '   aceptación en producción hasta que el abogado los apruebe y se retire\n' +
      '   esa nota. Retirarla cambia la huella y obliga a aceptar de nuevo, que\n' +
      '   es exactamente lo que debe pasar.',
  )
  // Se avisa y no se falla: hay que poder construir y probar el flujo antes de
  // que los documentos estén aprobados.
}
