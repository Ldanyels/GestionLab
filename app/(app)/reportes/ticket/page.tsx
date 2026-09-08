import { BackRow } from '@/components/ui/BackRow'
import { requirePermiso } from '@/lib/auth'
import { veMontosReportes } from '@/lib/permisos'
import { nombreLaboratorioActual } from '@/lib/tenant'
import { filasReporte } from '@/lib/reportes/data'
import { agruparPorConsultorio, soloConSaldo } from '@/lib/reportes/agrupar'
import { resolverFiltros, etiquetaRango, queryFiltros } from '@/lib/reportes/filtros'
import { lineasReporteTicket } from '@/lib/reportes/lineas'
import { ReciboTicket } from '@/components/trabajos/ReciboTicket'

export default async function ReporteTicketPage({
  searchParams,
}: {
  searchParams: Promise<{
    desde?: string
    hasta?: string
    consultorio?: string
    doctor?: string
    mostrar?: string
  }>
}) {
  const perfil = await requirePermiso('reportes')
  const montos = veMontosReportes(perfil)
  const sp = await searchParams
  const f = resolverFiltros(sp)
  const [todas, laboratorio] = await Promise.all([
    filasReporte(f),
    nombreLaboratorioActual(),
  ])
  const filas = f.soloPendientes ? soloConSaldo(todas) : todas
  const { grupos, totales } = agruparPorConsultorio(filas)
  const query = queryFiltros(f)

  const lineas = lineasReporteTicket({
    laboratorio,
    fecha: new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Lima',
    }).format(new Date()),
    rango: etiquetaRango(f.desde, f.hasta),
    soloPendientes: f.soloPendientes,
    montos,
    filtro: f.doctorId
      ? grupos[0]?.doctores[0]?.doctor
      : f.consultorioId
        ? grupos[0]?.consultorio
        : undefined,
    grupos,
    totales,
  })

  return (
    <section className="space-y-4">
      <BackRow
        href={`/reportes?${query}`}
        migaDePan="Reportes"
        titulo={montos && f.soloPendientes ? 'Cobranza en ticket' : 'Reporte en ticket'}
      />
      <ReciboTicket lineas={lineas} pdfHref={`/reportes/pdf?${query}`} pdfLabel="PDF A4" />
    </section>
  )
}
