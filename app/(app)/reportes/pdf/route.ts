import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { requirePermiso } from '@/lib/auth'
import { veMontos } from '@/lib/permisos'
import { nombreLaboratorioActual } from '@/lib/tenant'
import { filasReporte } from '@/lib/reportes/data'
import { agruparPorConsultorio, soloConSaldo } from '@/lib/reportes/agrupar'
import { resolverFiltros, etiquetaRango } from '@/lib/reportes/filtros'
import { textoSeguro } from '@/lib/recibos/lineas'
import { truncar } from '@/lib/pdf/util'
import { ETIQUETA_TRABAJO, type EstadoTrabajo } from '@/lib/trabajos/estado'
import { formatMoney } from '@/lib/format'

// A4 en puntos.
const ANCHO = 595.28
const ALTO = 841.89
const MARGEN = 40
const UTIL = ANCHO - MARGEN * 2

const GRIS = rgb(0.42, 0.42, 0.45)
const NEGRO = rgb(0.1, 0.1, 0.12)
const ROJO = rgb(0.72, 0.16, 0.16)

export async function GET(req: Request): Promise<Response> {
  try {
    const perfil = await requirePermiso('reportes')
    const montos = veMontos(perfil)
    const url = new URL(req.url)
    const f = resolverFiltros({
      desde: url.searchParams.get('desde') ?? undefined,
      hasta: url.searchParams.get('hasta') ?? undefined,
      consultorio: url.searchParams.get('consultorio') ?? undefined,
      doctor: url.searchParams.get('doctor') ?? undefined,
      mostrar: url.searchParams.get('mostrar') ?? undefined,
    })
    const [filasCrudas, laboratorioCrudo] = await Promise.all([
      filasReporte(f),
      nombreLaboratorioActual(),
    ])
    // Las fuentes estándar de PDF solo soportan WinAnsi: sanear el texto libre
    // ANTES de medirlo o truncarlo (widthOfTextAtSize falla con lo no soportado).
    const laboratorio = textoSeguro(laboratorioCrudo)
    const saneadas = filasCrudas.map((r) => ({
      ...r,
      consultorio: textoSeguro(r.consultorio),
      doctor: textoSeguro(r.doctor),
      resumen: textoSeguro(r.resumen),
      paciente: r.paciente ? textoSeguro(r.paciente) : null,
    }))
    const filas = f.soloPendientes ? soloConSaldo(saneadas) : saneadas
    const { grupos, totales } = agruparPorConsultorio(filas)

    const doc = await PDFDocument.create()
    const normal = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)

    let page = doc.addPage([ANCHO, ALTO])
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

    const saltoPagina = (necesario: number) => {
      if (y - necesario >= MARGEN) return
      page = doc.addPage([ANCHO, ALTO])
      y = ALTO - MARGEN
    }

    // Encabezado
    y -= 6
    texto(laboratorio, { size: 16, font: bold })
    y -= 18
    texto(
      !montos
        ? 'Trabajos por consultorio'
        : f.soloPendientes
          ? 'Pendiente por cobrar'
          : 'Reporte de trabajos',
      { size: 11, font: bold },
    )
    y -= 14
    texto(etiquetaRango(f.desde, f.hasta), { size: 9, color: GRIS })
    texto(
      new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Lima',
      }).format(new Date()),
      { size: 9, color: GRIS, alDerecha: true },
    )
    y -= 12
    page.drawLine({
      start: { x: MARGEN, y },
      end: { x: ANCHO - MARGEN, y },
      thickness: 1,
      color: NEGRO,
    })
    y -= 20

    // Resumen
    const cajas: [string, string][] = montos
      ? [
          [f.soloPendientes ? 'Trabajos con deuda' : 'Trabajos', String(totales.trabajos)],
          ['Facturado', formatMoney(totales.facturado)],
          [f.soloPendientes ? 'Abonado a cuenta' : 'Pagado', formatMoney(totales.pagado)],
          ['Por cobrar', formatMoney(totales.saldo)],
        ]
      : [
          ['Trabajos', String(totales.trabajos)],
          ['Consultorios', String(grupos.length)],
        ]
    const anchoCaja = UTIL / cajas.length
    cajas.forEach(([label, valor], i) => {
      const x = MARGEN + i * anchoCaja
      page.drawText(textoSeguro(label), { x, y, size: 8, font: normal, color: GRIS })
      page.drawText(textoSeguro(valor), {
        x,
        y: y - 14,
        size: 12,
        font: bold,
        color: montos && i === 3 && totales.saldo > 0.001 ? ROJO : NEGRO,
      })
    })
    y -= 34

    if (grupos.length === 0) {
      y -= 10
      texto(
        f.soloPendientes
          ? 'No hay deuda pendiente en el rango seleccionado.'
          : 'No hay trabajos en el rango seleccionado.',
        { size: 10, color: GRIS },
      )
    }

    for (const g of grupos) {
      saltoPagina(60)
      y -= 10
      page.drawRectangle({
        x: MARGEN,
        y: y - 4,
        width: UTIL,
        height: 18,
        color: rgb(0.95, 0.95, 0.96),
      })
      const trabajosGrupo = g.doctores.reduce((s, d) => s + d.filas.length, 0)
      texto(truncar(bold, g.consultorio, 10, UTIL - 120), { x: MARGEN + 6, size: 10, font: bold })
      texto(montos ? `Debe ${formatMoney(g.saldo)}` : `${trabajosGrupo} trabajos`, {
        size: 10,
        font: bold,
        alDerecha: true,
        color: montos && g.saldo > 0.001 ? ROJO : NEGRO,
      })
      y -= 22

      for (const d of g.doctores) {
        saltoPagina(40)
        texto(truncar(bold, d.doctor, 9, UTIL - 200), { x: MARGEN + 8, size: 9, font: bold })
        texto(
          montos
            ? `${d.filas.length} trab. · Fact. ${formatMoney(d.facturado)} · Pag. ${formatMoney(d.pagado)} · Debe ${formatMoney(d.saldo)}`
            : `${d.filas.length} trab.`,
          { size: 8, color: GRIS, alDerecha: true },
        )
        y -= 14

        for (const t of d.filas) {
          saltoPagina(16)
          const saldo = Math.round((t.total - t.pagado) * 100) / 100
          const desc = `${t.fecha_ingreso} · ${t.resumen}${t.paciente ? ` · ${t.paciente}` : ''}`
          texto(truncar(normal, desc, 8.5, UTIL - (montos ? 180 : 70)), {
            x: MARGEN + 18,
            size: 8.5,
            color: GRIS,
          })
          texto(
            montos
              ? `${formatMoney(t.total)}   ${formatMoney(t.pagado)}   ${formatMoney(saldo)}`
              : (ETIQUETA_TRABAJO[t.estado as EstadoTrabajo] ?? t.estado),
            { size: 8.5, alDerecha: true, color: montos && saldo > 0.001 ? ROJO : GRIS },
          )
          y -= 12
        }
        y -= 4
      }
    }

    const bytes = await doc.save()
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${montos && f.soloPendientes ? 'cobranza' : 'trabajos'}-${f.desde}-a-${f.hasta}.pdf"`,
      },
    })
  } catch {
    return new Response('No disponible', { status: 404 })
  }
}
