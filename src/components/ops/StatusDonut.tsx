'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface StatusDonutProps {
  data: Array<{ status: string; count: number }>
}

const STATUS_COLORS: Record<string, string> = {
  'New': '#58a6ff',
  'In Progress': '#3fb950',
  'Waiting Customer': '#d29922',
  'Waiting Vendor': '#f0883e',
  'Schedule Hold': '#d29922',
  'Scheduled': '#bc8cff',
  'Completed': '#8b949e',
  'Closed': '#484f58',
}

function getColor(status: string): string {
  return STATUS_COLORS[status] ?? '#8b949e'
}

export function StatusDonut({ data }: StatusDonutProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No data available
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="count"
            nameKey="status"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '8px',
              color: '#e6edf3',
              fontSize: '13px',
            }}
            formatter={(value, name) => [`${value} tickets`, String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {data.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getColor(entry.status) }}
            />
            {entry.status} ({entry.count})
          </div>
        ))}
      </div>
    </div>
  )
}