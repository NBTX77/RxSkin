'use client'

import { memo } from 'react'

interface StatCardProps {
  label: string
  value: number
  total: number
  color?: 'blue' | 'purple' | 'red' | 'green'
}

const colorMap = {
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  red: 'bg-red-500/10 border-red-500/20 text-red-400',
  green: 'bg-green-500/10 border-green-500/20 text-green-400',
}

export const StatCard = memo(function StatCard({ label, value, total, color = 'blue' }: StatCardProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs opacity-60 mt-1">{pct}% of {total}</p>
    </div>
  )
})
