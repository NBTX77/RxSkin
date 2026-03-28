'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

interface WorkloadBarsProps {
  data: Array<{ name: string; count: number }>
}

const BAR_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#eab308', '#ef4444', '#6b7280', '#3b82f6']

export function WorkloadBars({ data }: WorkloadBarsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)

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
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-sm">
        No data available
      </div>
    )
  }

  // Embed fill color directly in data so Recharts can use it without Cell
  const coloredData = data.map((d, i) => ({ ...d, fill: BAR_COLORS[i % BAR_COLORS.length] }))

  const chartHeight = 288

  return (
    <div ref={containerRef} style={{ width: '100%', height: chartHeight }}>
      <BarChart width={width} height={chartHeight} data={coloredData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <XAxis
          type="number"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={{ stroke: '#374151' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#d1d5db', fontSize: 12 }}
          width={120}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip formatter={(value) => [`${value} tickets`, 'Assigned']} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </div>
  )
}
