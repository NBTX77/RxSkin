'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PieChart, Pie, Tooltip } from 'recharts'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(400)

  const measure = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth
      if (w > 0) setWidth(w)
    }
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(() => measure())
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [measure])

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-56 text-gray-400 dark:text-gray-500 text-sm">
        No data available
      </div>
    )
  }

  // Embed fill color directly in data so Recharts can use it without Cell
  const coloredData = data.map((d) => ({ ...d, fill: getColor(d.status) }))

  const chartHeight = 220
  const outerR = Math.min(width / 2, chartHeight / 2) * 0.75
  const innerR = outerR * 0.65

  return (
    <div>
      <div ref={containerRef} style={{ width: '100%', height: chartHeight }}>
        <PieChart width={width} height={chartHeight}>
          <Pie
            data={coloredData}
            cx={width / 2}
            cy={chartHeight / 2}
            innerRadius={innerR}
            outerRadius={outerR}
            dataKey="count"
            nameKey="status"
            paddingAngle={2}
            stroke="none"
          />
          <Tooltip formatter={(value, name) => [`${value} tickets`, String(name)]} />
        </PieChart>
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
