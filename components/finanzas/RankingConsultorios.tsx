'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney } from '@/lib/format'
import type { RankingItem } from '@/lib/finanzas/data'

const COLOR = '#2563eb'

export function RankingConsultorios({ datos }: { datos: RankingItem[] }) {
  if (datos.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--color-muted)]">
        Sin ingresos en el periodo.
      </p>
    )
  }
  const alto = Math.max(160, datos.length * 44)

  return (
    <div style={{ height: alto }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `S/${v}`}
          />
          <YAxis
            type="category"
            dataKey="consultorio"
            tick={{ fontSize: 12, fill: 'var(--color-text)' }}
            axisLine={false}
            tickLine={false}
            width={120}
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
          <Bar dataKey="ingreso" fill={COLOR} radius={[0, 4, 4, 0]} name="Ingreso" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
