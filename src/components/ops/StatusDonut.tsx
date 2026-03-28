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
  return STATUS_COLORS[status.trim()] ?? '#9ca3af'
}

export function StatusDonut({ data }: StatusDonutProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-sm">
        No data available
      </div>
    )
  }

  return (
    <div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="count"
              nameKey="status"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #ffffff)',
                border: '1px solid var(--tooltip-border, #e5e7eb)',
                borderRadius: '8px',
                color: 'var(--tooltip-text, #111827)',
                fontSize: '13px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value, name) => [`${value} tickets`, String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {data.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getColor(entry.status) }}
            />
            {entry.status.trim()} ({entry.count})
          </div>
        ))}
      </div>
    </div>
  )
}
