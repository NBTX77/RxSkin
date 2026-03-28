'use client'

import { useState, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'

interface PriorityDonutProps {
  data: Array<{ priority: string; count: number; color: string }>
}

export function PriorityDonut({ data }: PriorityDonutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setDims({ width: Math.floor(width), height: Math.floor(height) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-56 text-gray-400 dark:text-gray-500 text-sm">
        No data available
      </div>
    )
  }

  const outerR = Math.min(dims.width / 2, dims.height / 2) * 0.8
  const innerR = outerR * 0.65

  return (
    <div>
      <div ref={containerRef} style={{ width: '100%', height: 220 }}>
        {dims.width > 0 && dims.height > 0 && (
          <PieChart width={dims.width} height={dims.height}>
            <Pie
              data={data}
              cx={dims.width / 2}
              cy={dims.height / 2}
              innerRadius={innerR}
              outerRadius={outerR}
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
        )}
      </div>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {data.map((entry) => (
          <div key={entry.priority} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
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
