'use client'

import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: number | string
  icon?: ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  detail?: string
}

const colorMap = {
  blue: 'bg-blue-500/5 text-blue-400',
  green: 'bg-green-500/5 text-green-400',
  orange: 'bg-orange-500/5 text-orange-400',
  red: 'bg-red-500/5 text-red-400',
  purple: 'bg-purple-500/5 text-purple-400',
}

export function KpiCard({ label, value, icon, color = 'blue', detail }: KpiCardProps) {
  return (
    <div className={`${colorMap[color]} border border-gray-800 rounded-xl p-4`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {icon && <span className="opacity-60">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      {detail && (
        <p className="text-xs text-gray-500 mt-1">{detail}</p>
      )}
    </div>
  )
}
