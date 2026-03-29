'use client'

import type { TechFilter } from '@/types/ops'

interface EntryTypeFilterProps {
  activeFilter: TechFilter
  onFilterChange: (filter: TechFilter) => void
  counts?: {
    all: number
    critical: number
    high: number
    inProgress: number
    multiTech: number
    lowHos: number
  }
}

const filters: { value: TechFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'inProgress', label: 'In Progress' },
  { value: 'multiTech', label: 'Multi-Tech' },
  { value: 'lowHos', label: 'Low HOS' },
]

export function EntryTypeFilter({ activeFilter, onFilterChange, counts }: EntryTypeFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map(({ value, label }) => {
        const isActive = activeFilter === value
        const count = counts?.[value]
        return (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              isActive
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 border border-gray-200 dark:border-gray-700/50 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-800'
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className="ml-1 opacity-70">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
