import { requireAdmin } from '@/lib/auth'
import { estadoCuentaConsultorios } from '@/lib/finanzas/data'
import { construirCsv, respuestaCsv } from '@/lib/csv'

export async function GET() {
  await requireAdmin()
  const cuentas = await estadoCuentaConsultorios()
  const csv = construirCsv(
    ['Consultorio', 'Facturado', 'Pagado', 'Saldo'],
    cuentas.map((c) => [c.consultorio, c.facturado, c.pagado, c.saldo]),
  )
  return respuestaCsv('estado-de-cuenta.csv', csv)
}
