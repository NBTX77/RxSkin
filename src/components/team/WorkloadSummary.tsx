'use client'

import { Users, BarChart3, AlertTriangle, UserCheck } from 'lucide-react'
import type { WorkloadSummary as WorkloadSummaryType } from '@/types/team'

interface WorkloadSummaryProps {
  summary: WorkloadSummaryType
  isLoading: boolean
}

interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
  isLoading: boolean
}

function KpiCard({ icon, label, value, color, isLoading }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color ?? 'bg-blue-500/10 text-blue-500'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">{label}</p>
        {isLoading ? (
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
      </div>
    </div>
  )
}

export function WorkloadSummary({ summary, isLoading }: WorkloadSummaryProps) {
  const utilizationColor =
    summary.avgUtilization > 100
      ? 'text-red-500'
      : summary.avgUtilization > 75
        ? 'text-yellow-500'
        : 'text-green-500'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        icon={<Users size={20} />}
        label="Active Techs"
        value={summary.activeTechs}
        color="bg-blue-500/10 text-blue-500"
        isLoading={isLoading}
      />
      <KpiCard
        icon={<BarChart3 size={20} className={utilizationColor} />}
        label="Avg Utilization"
        value={`${summary.avgUtilization}%`}
        color={
          summary.avgUtilization > 100
            ? 'bg-red-500/10 text-red-500'
            : summary.avgUtilization > 75
              ? 'bg-yellow-500/10 text-yellow-500'
              : 'bg-green-500/10 text-green-500'
        }
        isLoading={isLoading}
      />
      <KpiCard
        icon={<AlertTriangle size={20} />}
        label="Overbooked"
        value={summary.overbookedCount}
        color={summary.overbookedCount > 0 ? 'bg-red-500/10 text-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}
        isLoading={isLoading}
      />
      <KpiCard
        icon={<UserCheck size={20} />}
        label="Available"
        value={summary.availableCount}
        color={summary.availableCount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}
        isLoading={isLoading}
      />
    </div>
  )
}
