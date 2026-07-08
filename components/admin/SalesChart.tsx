'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint { data: string; total: number }
interface Props      { data: DataPoint[] }

function formatarData(iso: string): string {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

function formatarEixoY(valor: number): string {
  if (valor >= 1_000_000) return `Kz ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1000)      return `Kz ${(valor / 1000).toFixed(0)}k`
  return `Kz ${valor}`
}

const GOLD   = '#D4AF37'
const BORDER = '#DBDAD6'
const MUTED  = '#6B6B6B'

export default function SalesChart({ data }: Props) {
  const chartData = data.map((d) => ({ ...d, label: formatarData(d.data) }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: MUTED, fontFamily: 'var(--font-ui)' }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          tickFormatter={formatarEixoY}
          tick={{ fontSize: 10, fill: MUTED, fontFamily: 'var(--font-ui)' }}
          tickLine={false}
          axisLine={false}
          width={58}
        />
        <Tooltip
          formatter={(value) => [`Kz ${Number(value).toLocaleString('pt-AO')}`, 'Vendas']}
          labelFormatter={(label) => `Dia ${label}`}
          contentStyle={{
            background: '#1A1A1A',
            border: `1px solid ${GOLD}40`,
            borderRadius: '4px',
            fontSize: '11px',
            color: '#FBF9F5',
            fontFamily: 'var(--font-ui)',
          }}
          cursor={{ stroke: GOLD, strokeWidth: 1, strokeDasharray: '4 2' }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke={GOLD}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: GOLD, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
