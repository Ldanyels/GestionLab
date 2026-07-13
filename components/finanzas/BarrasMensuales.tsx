'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney } from '@/lib/format'
import type { PuntoMes } from '@/lib/finanzas/data'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const COLOR_INGRESOS = '#2563eb'
const COLOR_GASTOS = '#d97706'

function etiquetaMes(iso: string): string {
  const mes = Number(iso.slice(5, 7)) - 1
  return MESES[mes] ?? iso
}

export function BarrasMensuales({ datos }: { datos: PuntoMes[] }) {
  const data = datos.map((d) => ({
    mes: etiquetaMes(d.mes),
    Ingresos: d.ingresos,
    Gastos: d.gastos,
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => `S/${v}`}
          />
          <Tooltip
            formatter={(v) => formatMoney(Number(v))}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="Ingresos" fill={COLOR_INGRESOS} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill={COLOR_GASTOS} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
