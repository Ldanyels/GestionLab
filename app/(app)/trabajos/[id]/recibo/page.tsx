import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTrabajo } from '@/lib/trabajos/data'
import { listAbonos } from '@/lib/abonos/data'
import { nombreLaboratorioActual } from '@/lib/tenant'
import { lineasRecibo } from '@/lib/recibos/lineas'
import { ReciboTicket } from '@/components/trabajos/ReciboTicket'

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [t, abonos, laboratorio] = await Promise.all([
    getTrabajo(id),
    listAbonos(id),
    nombreLaboratorioActual(),
  ])
  if (!t) notFound()

  const fecha = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date())

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
  })

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href={`/trabajos/${t.id}`} className="text-[var(--color-muted)]">
          ‹
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Recibo de venta</h1>
      </div>
      <ReciboTicket lineas={lineas} pdfHref={`/trabajos/${t.id}/recibo/pdf`} />
    </section>
  )
}
