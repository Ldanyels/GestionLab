import { requirePermiso, respuestaSiSuspendido } from '@/lib/auth'
import { veMontosReportes } from '@/lib/permisos'
import { nombreLaboratorioActual } from '@/lib/tenant'
import { filasReporte } from '@/lib/reportes/data'
import { agruparPorConsultorio, soloConSaldo } from '@/lib/reportes/agrupar'
import { resolverFiltros } from '@/lib/reportes/filtros'
import { pdfDeReporte } from '@/lib/reportes/pdf'

export async function GET(req: Request): Promise<Response> {
  try {
    const perfil = await requirePermiso('reportes')
    // Esta ruta no pasa por app/(app)/layout.tsx, así que comprueba aquí el
    // estado de la cuenta.
    const bloqueo = await respuestaSiSuspendido()
    if (bloqueo) return bloqueo

    const montos = veMontosReportes(perfil)
    const url = new URL(req.url)
    const f = resolverFiltros({
      desde: url.searchParams.get('desde') ?? undefined,
      hasta: url.searchParams.get('hasta') ?? undefined,
      consultorio: url.searchParams.get('consultorio') ?? undefined,
      doctor: url.searchParams.get('doctor') ?? undefined,
      estado: url.searchParams.get('estado') ?? undefined,
      periodo: url.searchParams.get('periodo') ?? undefined,
      pago: url.searchParams.get('pago') ?? undefined,
      mostrar: url.searchParams.get('mostrar') ?? undefined,
    })
    const [filasCrudas, laboratorio] = await Promise.all([
      filasReporte(f),
      nombreLaboratorioActual(),
    ])
    const filas = f.soloPendientes ? soloConSaldo(filasCrudas) : filasCrudas
    const { grupos, totales } = agruparPorConsultorio(filas)

    const bytes = await pdfDeReporte({
      laboratorio,
      montos,
      soloPendientes: f.soloPendientes,
      desde: f.desde,
      hasta: f.hasta,
      grupos,
      totales,
    })

    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        // Con «Todo» no hay fechas: el nombre las omite en vez de dejar
        // «trabajos--a-.pdf».
        'Content-Disposition': `attachment; filename="${montos && f.soloPendientes ? 'cobranza' : 'trabajos'}${f.desde && f.hasta ? `-${f.desde}-a-${f.hasta}` : '-todo'}.pdf"`,
      },
    })
  } catch {
    return new Response('No disponible', { status: 404 })
  }
}
