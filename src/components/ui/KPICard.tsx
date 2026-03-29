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
  subtitle?: string
}

export function KPICard({ icon: IconComponent, color, label, value, trend, subtitle }: KPICardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg px-3 py-2.5 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`${color} p-1.5 rounded-md flex-shrink-0`}>
          <IconComponent className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
          {subtitle && <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>}
        </div>
        {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
        {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
      </div>
    </div>
  )
}
