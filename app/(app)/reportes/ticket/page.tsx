import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
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
  await requireAdmin()
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
      <div className="flex items-center gap-2">
        <Link href={`/reportes?${query}`} className="text-[var(--color-muted)]">
          ‹
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">
          {f.soloPendientes ? 'Cobranza en ticket' : 'Reporte en ticket'}
        </h1>
      </div>
      <ReciboTicket lineas={lineas} pdfHref={`/reportes/pdf?${query}`} pdfLabel="PDF A4" />
    </section>
  )
}
