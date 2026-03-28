'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface PriorityDonutProps {
  data: Array<{ priority: string; count: number; color: string }>
}

export function PriorityDonut({ data }: PriorityDonutProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-56 text-gray-500 text-sm">
        No data available
      </div>
    )
  }

  return (
    <div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="count"
              nameKey="priority"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} tickets`, String(name)]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {data.map((entry) => (
          <div key={entry.priority} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.priority} ({entry.count})
          </div>
        ))}
      </div>
    </div>
  )
}
