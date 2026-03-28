'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface StatusDonutProps {
  data: Array<{ status: string; count: number }>
}

const STATUS_COLORS: Record<string, string> = {
  'New': '#3b82f6',
  'In Progress': '#22c55e',
  'Waiting Customer': '#eab308',
  'Waiting Vendor': '#f97316',
  'Schedule Hold': '#eab308',
  'Scheduled': '#a855f7',
  'Completed': '#6b7280',
  'Closed': '#9ca3af',
}

function getColor(status: string): string {
  return STATUS_COLORS[status] ?? '#9ca3af'
}

export function StatusDonut({ data }: StatusDonutProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
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
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#111827',
              fontSize: '13px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value, name) => [`${value} tickets`, String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {data.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5 text-xs text-gray-600">
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
