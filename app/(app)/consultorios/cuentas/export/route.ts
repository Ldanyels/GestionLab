import { requireAdmin, respuestaSiSuspendido } from '@/lib/auth'
import { estadoCuentaConsultorios } from '@/lib/finanzas/data'
import { construirCsv, respuestaCsv } from '@/lib/csv'

export async function GET() {
  await requireAdmin()
  // Esta ruta no pasa por app/(app)/layout.tsx, así que comprueba aquí el
  // estado de la cuenta.
  const bloqueo = await respuestaSiSuspendido()
  if (bloqueo) return bloqueo

  const cuentas = await estadoCuentaConsultorios()
  const csv = construirCsv(
    ['Consultorio', 'Monto final', 'Pagado', 'Saldo'],
    cuentas.map((c) => [c.consultorio, c.facturado, c.pagado, c.saldo]),
  )
  return respuestaCsv('estado-de-cuenta.csv', csv)
}
