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

interface DataPoint {
  data: string
  total: number
}

interface Props {
  data: DataPoint[]
}

function formatarData(iso: string): string {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

function formatarEixoY(valor: number): string {
  if (valor >= 1000) return `Kz ${(valor / 1000).toFixed(0)}k`
  return `Kz ${valor}`
}

export default function SalesChart({ data }: Props) {
  const chartData = data.map((d) => ({ ...d, label: formatarData(d.data) }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe5" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#555555', fontFamily: 'var(--font-sans)' }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          tickFormatter={formatarEixoY}
          tick={{ fontSize: 11, fill: '#555555', fontFamily: 'var(--font-sans)' }}
          tickLine={false}
          axisLine={false}
          width={55}
        />
        <Tooltip
          formatter={(value) => [`Kz ${Number(value).toLocaleString('pt-AO')}`, 'Vendas']}
          labelFormatter={(label) => `Dia ${label}`}
          contentStyle={{
            background: '#181818',
            border: '1px solid rgba(247,196,128,0.3)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#eadeca',
            fontFamily: 'var(--font-sans)',
          }}
          cursor={{ stroke: '#f7c480', strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#f7c480"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#f7c480', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
