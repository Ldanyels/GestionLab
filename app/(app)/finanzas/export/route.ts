import { requireAdmin, respuestaSiSuspendido } from '@/lib/auth'
import { porMes } from '@/lib/finanzas/data'
import { construirCsv, respuestaCsv } from '@/lib/csv'

export async function GET() {
  await requireAdmin()
  // Esta ruta no pasa por app/(app)/layout.tsx, así que comprueba aquí el
  // estado de la cuenta.
  const bloqueo = await respuestaSiSuspendido()
  if (bloqueo) return bloqueo

  const meses = await porMes(12)
  const csv = construirCsv(
    ['Mes', 'Ingresos', 'Gastos', 'Utilidad'],
    meses.map((m) => [
      m.mes,
      m.ingresos,
      m.gastos,
      Math.round((m.ingresos - m.gastos) * 100) / 100,
    ]),
  )
  return respuestaCsv('finanzas-por-mes.csv', csv)
}
