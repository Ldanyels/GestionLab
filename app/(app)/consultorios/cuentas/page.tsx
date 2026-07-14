import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { estadoCuentaConsultorios } from '@/lib/finanzas/data'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'

export default async function CuentasPage() {
  await requireAdmin()
  const cuentas = await estadoCuentaConsultorios()
  const totalSaldo = cuentas.reduce((s, c) => s + c.saldo, 0)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/consultorios" className="text-sm text-[var(--color-muted)]">
            ‹ Consultorios
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Estado de cuenta</h1>
        </div>
        <a
          href="/consultorios/cuentas/export"
          className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
        >
          Exportar CSV
        </a>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--color-muted)]">Saldo total por cobrar</span>
          <span className="num font-semibold text-[var(--color-danger)]">
            {formatMoney(totalSaldo)}
          </span>
        </div>
      </div>

      {cuentas.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          Aún no hay movimientos por consultorio.
        </p>
      ) : (
        <ul className="space-y-2">
          {cuentas.map((c) => (
            <li
              key={c.consultorio}
              style={{ borderLeftColor: colorConsultorio(c.consultorio) }}
              className="rounded-[var(--radius-md)] border border-l-4 border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <p className="truncate font-medium">{c.consultorio}</p>
              <div className="mt-1 grid grid-cols-3 gap-2 text-center text-sm">
                <span>
                  <span className="block text-xs text-[var(--color-muted)]">Facturado</span>
                  <span className="num">{formatMoney(c.facturado)}</span>
                </span>
                <span>
                  <span className="block text-xs text-[var(--color-muted)]">Pagado</span>
                  <span className="num">{formatMoney(c.pagado)}</span>
                </span>
                <span>
                  <span className="block text-xs text-[var(--color-muted)]">Saldo</span>
                  <span
                    className={`num ${c.saldo > 0.001 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}
                  >
                    {formatMoney(c.saldo)}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
