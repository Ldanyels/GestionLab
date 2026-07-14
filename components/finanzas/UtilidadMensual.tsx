'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney } from '@/lib/format'
import type { PuntoMes } from '@/lib/finanzas/data'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const COLOR = '#059669' // verde utilidad

function etiquetaMes(iso: string): string {
  return MESES[Number(iso.slice(5, 7)) - 1] ?? iso
}

export function UtilidadMensual({ datos }: { datos: PuntoMes[] }) {
  const data = datos.map((d) => ({
    mes: etiquetaMes(d.mes),
    Utilidad: Math.round((d.ingresos - d.gastos) * 100) / 100,
  }))

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
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
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Tooltip
            formatter={(v) => formatMoney(Number(v))}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              fontSize: 13,
            }}
          />
          <Line
            type="monotone"
            dataKey="Utilidad"
            stroke={COLOR}
            strokeWidth={2.5}
            dot={{ r: 3, fill: COLOR }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
