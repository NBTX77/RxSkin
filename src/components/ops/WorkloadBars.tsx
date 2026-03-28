'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

interface WorkloadBarsProps {
  data: Array<{ name: string; count: number }>
}

const BAR_COLORS = ['#58a6ff', '#3fb950', '#f0883e', '#bc8cff', '#d29922', '#f85149', '#8b949e', '#58a6ff']

export function WorkloadBars({ data }: WorkloadBarsProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No data available
      </div>
    )
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <XAxis type="number" tick={{ fill: '#8b949e', fontSize: 12 }} axisLine={{ stroke: '#30363d' }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#e6edf3', fontSize: 12 }}
            width={120}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '8px',
              color: '#e6edf3',
              fontSize: '13px',
            }}
            formatter={(value) => [`${value} tickets`, 'Assigned']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}