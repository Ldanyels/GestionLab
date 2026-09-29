import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { textoSeguro } from '@/lib/recibos/lineas'
import { truncar } from '@/lib/pdf/util'
import { formatMoney } from '@/lib/format'
import { etiquetaRango } from './filtros'
import {
  ajustarAnchos,
  celdasDeFila,
  celdasDeSubtotal,
  columnasReporte,
  RELLENO,
  xDeColumnas,
} from './columnas'
import type { GrupoConsultorio, TotalesReporte } from './agrupar'

// A4 apaisado, en puntos: la matriz no cabe en vertical.
const ANCHO = 841.89
const ALTO = 595.28
const MARGEN = 40
const UTIL = ANCHO - MARGEN * 2

const GRIS = rgb(0.42, 0.42, 0.45)
const NEGRO = rgb(0.1, 0.1, 0.12)
const ROJO = rgb(0.72, 0.16, 0.16)
const CEBRA = rgb(0.965, 0.965, 0.975)
const CABECERA = rgb(0.88, 0.89, 0.92)

const ALTO_FILA = 15
const CUERPO = 8

export interface DatosPdfReporte {
  laboratorio: string
  /** false = un técnico: sin columnas de dinero. */
  montos: boolean
  soloPendientes: boolean
  desde: string
  hasta: string
  grupos: GrupoConsultorio[]
  totales: TotalesReporte
}

/**
 * El reporte de trabajos como una matriz: cabeceras de columna que se repiten
 * en cada página, una fila por trabajo y un subtotal por consultorio.
 *
 * Vive aquí y no en la ruta para poder generarlo sin sesión: un documento que
 * solo se puede construir pasando por la autenticación es un documento que
 * nadie mira hasta que un cliente se queja.
 */
export async function pdfDeReporte(d: DatosPdfReporte): Promise<Uint8Array> {
  const { montos, grupos, totales } = d
  const laboratorio = textoSeguro(d.laboratorio)
  const f = { soloPendientes: d.soloPendientes, desde: d.desde, hasta: d.hasta }

    const doc = await PDFDocument.create()
    const normal = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)

    /*
      Las columnas se miden contra el contenido real antes de dibujar nada.

      Con anchos fijos el reporte aguanta hasta que alguien da de alta un
      consultorio con el nombre largo, y a partir de ahí corta nombres sin que
      nadie lo note. Se mide una sola vez, con todas las filas —también las de
      subtotal, que van en negrita y ocupan más—, para que la tabla no cambie
      de forma al pasar de página.
    */
    const declaradas = columnasReporte(montos)
    const celdasTodas = [
      ...grupos.flatMap((g) =>
        g.doctores.flatMap((d) => d.filas.map((t) => celdasDeFila(t, declaradas))),
      ),
      ...grupos.map((g) =>
        celdasDeSubtotal(g, g.doctores.reduce((s, d) => s + d.filas.length, 0), declaradas),
      ),
    ]
    // La negrita de los subtotales es más ancha que la redonda: se mide con
    // ella para no quedarse corto justo en la fila que se usa para cobrar.
    const columnas = ajustarAnchos(
      declaradas,
      celdasTodas,
      (t) => bold.widthOfTextAtSize(textoSeguro(t), CUERPO),
      UTIL,
    )
    const xs = xDeColumnas(columnas, MARGEN)

    let page: PDFPage = doc.addPage([ANCHO, ALTO])
    let y = ALTO - MARGEN

    const texto = (
      s: string,
      opts: { x?: number; size?: number; font?: PDFFont; color?: typeof GRIS; alDerecha?: boolean },
    ) => {
      const size = opts.size ?? 9
      const font = opts.font ?? normal
      const limpio = textoSeguro(s)
      const x = opts.alDerecha
        ? ANCHO - MARGEN - font.widthOfTextAtSize(limpio, size)
        : (opts.x ?? MARGEN)
      page.drawText(limpio, { x, y, size, font, color: opts.color ?? NEGRO })
    }

    /**
     * Pinta una fila de la matriz respetando la alineación de cada columna.
     *
     * Cada celda se trunca a su propio ancho: así una columna larga no invade
     * la de al lado, que en una tabla sin líneas verticales es lo que hace
     * ilegible el conjunto.
     */
    const filaTabla = (
      celdas: readonly string[],
      opts: {
        font?: PDFFont
        color?: typeof GRIS
        /**
         * Pinta en rojo la celda del abono. Se usa solo en los subtotales: ya
         * no hay columna de saldo, y marcar cada fila impaga teñía de rojo dos
         * tercios del papel —lo que se destaca en todas partes deja de
         * destacar—. Por consultorio, que es como se cobra, la señal sirve.
         */
        conDeuda?: boolean
        /** La primera celda puede invadir la segunda (fila de subtotal). */
        primeraAncha?: boolean
      } = {},
    ) => {
      const font = opts.font ?? normal
      celdas.forEach((celda, i) => {
        const col = columnas[i]
        if (!col || !celda) return
        const disponible =
          opts.primeraAncha && i === 0 ? col.ancho + (columnas[1]?.ancho ?? 0) : col.ancho
        const recortada = truncar(font, celda, CUERPO, disponible - RELLENO)
        const x = col.derecha
          ? xs[i]! - RELLENO * 0.7 - font.widthOfTextAtSize(recortada, CUERPO)
          : xs[i]! + RELLENO * 0.3
        page.drawText(recortada, {
          x,
          y,
          size: CUERPO,
          font,
          color:
            opts.conDeuda && col.clave === 'abono' ? ROJO : (opts.color ?? NEGRO),
        })
      })
    }

    /** La cabecera de columnas, en gris y en negrita. Se repite en cada página. */
    const cabeceraTabla = () => {
      page.drawRectangle({
        x: MARGEN,
        y: y - 4,
        width: UTIL,
        height: ALTO_FILA,
        color: CABECERA,
      })
      filaTabla(
        columnas.map((c) => c.titulo),
        { font: bold },
      )
      y -= ALTO_FILA + 3
    }

    const saltoPagina = (necesario: number) => {
      if (y - necesario >= MARGEN) return
      page = doc.addPage([ANCHO, ALTO])
      y = ALTO - MARGEN
      cabeceraTabla()
    }

    // ── Encabezado del documento ──────────────────────────────
    y -= 6
    texto(laboratorio, { size: 15, font: bold })
    texto(
      new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Lima',
      }).format(new Date()),
      { size: 8.5, color: GRIS, alDerecha: true },
    )
    y -= 16
    texto(
      !montos
        ? 'Trabajos por consultorio'
        : f.soloPendientes
          ? 'Pendiente por cobrar'
          : 'Reporte de trabajos',
      { size: 10.5, font: bold },
    )
    texto(etiquetaRango(f.desde, f.hasta), { size: 8.5, color: GRIS, alDerecha: true })
    y -= 12

    // ── Resumen ───────────────────────────────────────────────
    const cajas: [string, string][] = montos
      ? [
          [f.soloPendientes ? 'Trabajos con deuda' : 'Trabajos', String(totales.trabajos)],
          ['Monto final', formatMoney(totales.facturado)],
          [f.soloPendientes ? 'Abonado a cuenta' : 'Abonos', formatMoney(totales.pagado)],
          ['Por cobrar', formatMoney(totales.saldo)],
        ]
      : [
          ['Trabajos', String(totales.trabajos)],
          ['Consultorios', String(grupos.length)],
        ]
    const anchoCaja = UTIL / cajas.length
    cajas.forEach(([label, valor], i) => {
      const x = MARGEN + i * anchoCaja
      page.drawText(textoSeguro(label!), { x, y: y - 4, size: 8, font: normal, color: GRIS })
      page.drawText(textoSeguro(valor!), {
        x,
        y: y - 18,
        size: 12,
        font: bold,
        color: montos && i === 3 && totales.saldo > 0.001 ? ROJO : NEGRO,
      })
    })
    y -= 34

    // ── La matriz ─────────────────────────────────────────────
    if (grupos.length === 0) {
      texto(
        f.soloPendientes
          ? 'No hay deuda pendiente en el rango seleccionado.'
          : 'No hay trabajos en el rango seleccionado.',
        { size: 10, color: GRIS },
      )
    } else {
      cabeceraTabla()

      let cebra = false
      for (const g of grupos) {
        for (const d of g.doctores) {
          for (const t of d.filas) {
            saltoPagina(ALTO_FILA)
            if (cebra) {
              page.drawRectangle({
                x: MARGEN,
                y: y - 4,
                width: UTIL,
                height: ALTO_FILA,
                color: CEBRA,
              })
            }
            cebra = !cebra
            filaTabla(celdasDeFila(t, columnas))
            y -= ALTO_FILA
          }
        }

        /*
          El subtotal del consultorio cierra su bloque.

          Es la cifra por la que existe este papel: cuánto debe cada uno. Una
          matriz plana obligaría a sumarla a mano.
        */
        saltoPagina(ALTO_FILA + 6)
        page.drawLine({
          start: { x: MARGEN, y: y + ALTO_FILA - 5 },
          end: { x: ANCHO - MARGEN, y: y + ALTO_FILA - 5 },
          thickness: 0.5,
          color: GRIS,
        })
        const cuantos = g.doctores.reduce((s, d) => s + d.filas.length, 0)
        filaTabla(celdasDeSubtotal(g, cuantos, columnas), {
          font: bold,
          conDeuda: montos && g.saldo > 0.001,
          primeraAncha: true,
        })
        y -= ALTO_FILA + 8
        cebra = false
      }

      // Total general, al pie de la matriz.
      if (montos) {
        saltoPagina(ALTO_FILA + 6)
        page.drawRectangle({
          x: MARGEN,
          y: y - 4,
          width: UTIL,
          height: ALTO_FILA,
          color: CABECERA,
        })
        filaTabla(
          columnas.map((c) =>
            c.clave === 'consultorio'
              ? 'TOTAL'
              : c.clave === 'paciente'
                ? `${totales.trabajos} ${totales.trabajos === 1 ? 'trabajo' : 'trabajos'}`
                : c.clave === 'abono'
                  ? formatMoney(totales.pagado)
                  : c.clave === 'total'
                    ? formatMoney(totales.facturado)
                    : '',
          ),
          { font: bold, conDeuda: totales.saldo > 0.001, primeraAncha: true },
        )
        y -= ALTO_FILA
      }
    }

  return doc.save()
}
