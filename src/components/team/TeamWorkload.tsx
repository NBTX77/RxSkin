'use client'

import { useState, useMemo } from 'react'
import { CalendarDays, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTeamWorkload } from '@/hooks/useTeamWorkload'
import { useTechCSAT } from '@/hooks/useSmileBack'
import { WorkloadSummary } from './WorkloadSummary'
import { TechWorkloadCard } from './TechWorkloadCard'
import type { DepartmentCode } from '@/types'
import { DEPARTMENTS } from '@/types'
import type { TechWorkload as TechWorkloadType } from '@/types/team'

type ViewMode = 'grid' | 'list'

interface TechCSATEntry {
  techName: string
  csatPercent: number
  totalReviews: number
  recentTrend: 'up' | 'down' | 'stable'
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function TeamWorkload() {
  const [date, setDate] = useState(todayString)
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentCode | ''>('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const { techs, summary, isLoading, isError, error } = useTeamWorkload(
    date,
    departmentFilter || undefined
  )

  const { data: csatData } = useTechCSAT()
  const csatTechs: TechCSATEntry[] = useMemo(() => csatData?.techs ?? [], [csatData])

  // Merge CSAT data into tech workload entries using case-insensitive partial matching
  const techsWithCSAT: TechWorkloadType[] = useMemo(() => {
    if (csatTechs.length === 0) return techs

    return techs.map(tech => {
      const techNameLower = tech.name.toLowerCase()
      const match = csatTechs.find(ct => {
        const csatNameLower = ct.techName.toLowerCase()
        return csatNameLower.includes(techNameLower) || techNameLower.includes(csatNameLower)
      })
      if (match) {
        return {
          ...tech,
          csatPercent: match.csatPercent,
          csatReviews: match.totalReviews,
          csatTrend: match.recentTrend,
        }
      }
      return tech
    })
  }, [techs, csatTechs])

  // Compute team-wide CSAT average for summary
  const enrichedSummary = useMemo(() => {
    const techsWithReviews = csatTechs.filter(t => t.totalReviews > 0)
    if (techsWithReviews.length === 0) return { ...summary, teamCSAT: null, teamCSATReviews: 0 }

    const totalReviews = techsWithReviews.reduce((sum, t) => sum + t.totalReviews, 0)
    // Weighted average by review count
    const weightedCSAT = techsWithReviews.reduce((sum, t) => sum + t.csatPercent * t.totalReviews, 0) / totalReviews

    return {
      ...summary,
      teamCSAT: Math.round(weightedCSAT * 100) / 100,
      teamCSATReviews: totalReviews,
    }
  }, [summary, csatTechs])

  return (
    <div className="p-4 lg:p-6 space-y-6 pb-20 lg:pb-6" data-feedback-component="TeamWorkload">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Team Workload</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Tech schedules and capacity at a glance
          </p>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date navigation */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg">
            <button
              onClick={() => setDate(d => shiftDate(d, -1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-lg transition-colors text-gray-600 dark:text-gray-400"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 px-2">
              <CalendarDays size={14} className="text-gray-400 dark:text-gray-500" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-900 dark:text-white border-none outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => setDate(d => shiftDate(d, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-lg transition-colors text-gray-600 dark:text-gray-400"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Today button */}
          <button
            onClick={() => setDate(todayString())}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Today
          </button>

          {/* Department filter */}
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value as DepartmentCode | '')}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {Object.values(DEPARTMENTS).map(dept => (
              <option key={dept.code} value={dept.code}>
                {dept.code} - {dept.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-500/10 text-blue-500'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500/10 text-blue-500'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Date display */}
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {formatDateDisplay(date)}
      </p>

      {/* Summary KPIs */}
      <WorkloadSummary summary={enrichedSummary} isLoading={isLoading} />

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-700 dark:text-red-300">
            Failed to load team data: {error?.message ?? 'Unknown error'}
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Tech grid/list */}
      {!isLoading && !isError && (
        <>
          {techs.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-8 text-center">
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                No scheduled techs for this day
                {departmentFilter ? ` in ${departmentFilter}` : ''}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
                  : 'flex flex-col gap-3'
              }
            >
              {techsWithCSAT.map(tech => (
                <TechWorkloadCard key={tech.id} tech={tech} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
