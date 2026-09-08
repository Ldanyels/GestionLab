import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getTrabajo } from '@/lib/trabajos/data'
import { listAbonos } from '@/lib/abonos/data'
import { nombreLaboratorioActual } from '@/lib/tenant'
import { lineasRecibo, textoSeguro, type LineaRecibo } from '@/lib/recibos/lineas'
import { truncar } from '@/lib/pdf/util'

// Ticket de 80mm: 80mm ≈ 226.77pt.
const ANCHO = 226.77
const MARGEN = 10
const ALTO_LINEA = 13
const TAMANO = 8.5
const TAMANO_TITULO = 11

async function generarPdf(lineas: LineaRecibo[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const fuente = await doc.embedFont(StandardFonts.Courier)
  const negrita = await doc.embedFont(StandardFonts.CourierBold)

  const alto = MARGEN * 2 + lineas.length * ALTO_LINEA
  const page = doc.addPage([ANCHO, alto])
  let y = alto - MARGEN - TAMANO

  for (const l of lineas) {
    if (l.separador) {
      page.drawLine({
        start: { x: MARGEN, y: y + 3 },
        end: { x: ANCHO - MARGEN, y: y + 3 },
        thickness: 0.5,
        color: rgb(0.55, 0.55, 0.55),
        dashArray: [2, 2],
      })
    } else {
      const font = l.bold ? negrita : fuente
      const size = l.centrada && l.bold ? TAMANO_TITULO : TAMANO
      if (l.centrada) {
        const texto = truncar(font, l.izq, size, ANCHO - MARGEN * 2)
        const w = font.widthOfTextAtSize(texto, size)
        page.drawText(texto, { x: (ANCHO - w) / 2, y, size, font })
      } else if (l.der) {
        const wDer = font.widthOfTextAtSize(l.der, size)
        const maxIzq = ANCHO - MARGEN * 2 - wDer - 6
        page.drawText(truncar(font, l.izq, size, maxIzq), { x: MARGEN, y, size, font })
        page.drawText(l.der, { x: ANCHO - MARGEN - wDer, y, size, font })
      } else {
        page.drawText(truncar(font, l.izq, size, ANCHO - MARGEN * 2), {
          x: MARGEN,
          y,
          size,
          font,
        })
      }
    }
    y -= ALTO_LINEA
  }

  return doc.save()
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  // Sin sesión, con id inválido o de otro laboratorio: siempre 404 (no revelar nada).
  try {
    const { id } = await params
    const [t, abonos, laboratorio] = await Promise.all([
      getTrabajo(id),
      listAbonos(id),
      nombreLaboratorioActual(),
    ])
    if (!t) return new Response('Trabajo no encontrado', { status: 404 })

    const fecha = new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Lima',
    }).format(new Date())

    // Las fuentes estándar de PDF solo soportan WinAnsi: sanear texto libre.
    const lineas = lineasRecibo({
      laboratorio,
      fecha,
      doctor: t.doctor_nombre,
      consultorio: t.consultorio_nombre,
      paciente: t.paciente_nombre,
      items: t.items.map((i) => ({
        nombre: i.tipo_nombre,
        cantidad: i.cantidad,
        subtotal: i.subtotal,
        pieza: i.pieza,
      })),
      precioTotal: t.precio_acordado,
      abonos: abonos.map((a) => ({ fecha: a.fecha, metodo: a.metodo, monto: a.monto })),
    }).map((l) => ({
      ...l,
      izq: textoSeguro(l.izq),
      der: l.der ? textoSeguro(l.der) : undefined,
    }))

    const bytes = await generarPdf(lineas)
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recibo-${t.id.slice(0, 8)}.pdf"`,
      },
    })
  } catch {
    return new Response('Trabajo no encontrado', { status: 404 })
  }
}
