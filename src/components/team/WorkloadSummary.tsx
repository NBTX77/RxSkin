'use client'

import { Users, BarChart3, AlertTriangle, UserCheck } from 'lucide-react'
import { KPICard } from '@/components/ui/KPICard'
import type { WorkloadSummary as WorkloadSummaryType } from '@/types/team'

interface WorkloadSummaryProps {
  summary: WorkloadSummaryType
  isLoading: boolean
}

export function WorkloadSummary({ summary, isLoading }: WorkloadSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 animate-pulse"
          >
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const utilizationColor =
    summary.avgUtilization > 100
      ? 'bg-red-500'
      : summary.avgUtilization > 75
        ? 'bg-yellow-500'
        : 'bg-green-500'

  const overbookedColor =
    summary.overbookedCount > 0 ? 'bg-red-500' : 'bg-gray-400'

  const availableColor =
    summary.availableCount > 0 ? 'bg-green-500' : 'bg-gray-400'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        icon={Users}
        color="bg-blue-500"
        label="Active Techs"
        value={summary.activeTechs}
      />
      <KPICard
        icon={BarChart3}
        color={utilizationColor}
        label="Avg Utilization"
        value={`${summary.avgUtilization}%`}
      />
      <KPICard
        icon={AlertTriangle}
        color={overbookedColor}
        label="Overbooked"
        value={summary.overbookedCount}
      />
      <KPICard
        icon={UserCheck}
        color={availableColor}
        label="Available"
        value={summary.availableCount}
      />
    </div>
  )
}
