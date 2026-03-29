'use client'

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

type TrendDirection = 'up' | 'down'

interface KPICardProps {
  icon: LucideIcon
  color: string
  label: string
  value: string | number
  trend?: TrendDirection
}

export function KPICard({ icon: IconComponent, color, label, value, trend }: KPICardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`${color} p-2 rounded-lg`}>
          <IconComponent className="w-4 h-4 text-white" />
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
        {value}
      </p>
    </div>
  )
}
