'use client'

// ============================================================
// ExecutiveDashboard — RX Skin
// Leadership Team (LT) executive dashboard with KPIs,
// department performance, project health matrix, utilization,
// and recent highlights. Wired to live ConnectWise data.
// ============================================================

import { useState } from 'react'
import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Zap,
  Target,
  Info,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { KPICard } from '@/components/ui/KPICard'
import {
  useExecutiveData,
  type DepartmentPerformance,
  type ProjectHealthEntry,
  type ExecutiveHighlight,
} from '@/hooks/useExecutiveData'

// --------------- Types ---------------

type ProjectStatus = 'on-track' | 'watch' | 'over-budget'

// --------------- Icon Maps ---------------

const KPI_ICON_MAP: Record<string, LucideIcon> = {
  'Open Tickets': Zap,
  'Active Projects': Target,
  'Monthly Revenue': DollarSign,
  'Projects Over Budget': AlertCircle,
  'SLA Compliance': CheckCircle2,
}

const KPI_COLOR_MAP: Record<string, string> = {
  'Open Tickets': 'bg-blue-500',
  'Active Projects': 'bg-cyan-500',
  'Monthly Revenue': 'bg-emerald-500',
  'Projects Over Budget': 'bg-red-500',
  'SLA Compliance': 'bg-emerald-500',
}

const DEPT_COLORS: Record<string, { gradient: string; accent: string }> = {
  IT: { gradient: 'from-blue-600 to-blue-700', accent: 'bg-blue-500' },
  SI: { gradient: 'from-cyan-600 to-cyan-700', accent: 'bg-cyan-500' },
  AM: { gradient: 'from-emerald-600 to-emerald-700', accent: 'bg-emerald-500' },
  GA: { gradient: 'from-orange-600 to-orange-700', accent: 'bg-orange-500' },
}

const HIGHLIGHT_ICONS: Record<string, LucideIcon> = {
  success: CheckCircle2,
  alert: AlertCircle,
  warning: Clock,
  info: Info,
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  success: 'text-emerald-400',
  alert: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
}

// --------------- Helpers ---------------

function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case 'on-track':
      return 'bg-emerald-500 hover:bg-emerald-600'
    case 'watch':
      return 'bg-yellow-500 hover:bg-yellow-600'
    case 'over-budget':
      return 'bg-red-500 hover:bg-red-600'
  }
}

function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'on-track':
      return 'On Track'
    case 'watch':
      return 'Watch'
    case 'over-budget':
      return 'Over Budget'
  }
}

function getBarFill(utilization: number): string {
  if (utilization > 100) return '#ef4444'
  if (utilization > 80) return '#eab308'
  return '#10b981'
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  return `${hours}h ago`
}

// --------------- Custom Tooltip ---------------

interface TooltipPayloadItem {
  value: number
  dataKey: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function UtilizationTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Utilization: {payload[0].value}%
      </p>
    </div>
  )
}

// --------------- Loading Skeleton ---------------

function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* KPI strip skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 animate-pulse"
            >
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
              <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>

        {/* Department cards skeleton */}
        <div>
          <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 animate-pulse"
              >
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="space-y-2">
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6 h-64 animate-pulse" />
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6 h-64 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// --------------- Error State ---------------

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-md mx-auto mt-16 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {error.message || 'An unexpected error occurred while fetching executive data.'}
          </p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  )
}

// --------------- Component ---------------

export function ExecutiveDashboard() {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)
  const [, setSelectedDept] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useExecutiveData()

  if (isLoading) return <DashboardSkeleton />
  if (isError) return <DashboardError error={error as Error} onRetry={() => refetch()} />
  if (!data) return <DashboardSkeleton />

  const { kpis, departments, projectHealth, utilization, highlights, dataStatus, fetchedAt } = data

  // Map utilization data for the chart
  const utilizationChartData = utilization.map(u => ({
    name: u.name,
    utilization: u.utilization,
  }))

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* DATA STATUS BANNER */}
        <DataStatusBanner dataStatus={dataStatus} fetchedAt={fetchedAt} errors={data.errors} />

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Executive Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last refreshed: {formatTimeAgo(fetchedAt)}
          </p>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {kpis.map((kpi) => {
            const IconComponent = KPI_ICON_MAP[kpi.label] ?? Info
            const colorClass = KPI_COLOR_MAP[kpi.label] ?? 'bg-gray-500'
            return (
              <KPICard
                key={kpi.label}
                icon={IconComponent}
                color={colorClass}
                label={kpi.label}
                value={kpi.value}
                subtitle={kpi.phase2 ? 'Phase 2' : undefined}
              />
            )
          })}
        </div>

        {/* DEPARTMENT PERFORMANCE CARDS */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Department Performance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {departments.map((dept) => (
              <DepartmentCard
                key={dept.id}
                dept={dept}
                onSelect={() => setSelectedDept(dept.id)}
              />
            ))}
          </div>
        </div>

        {/* TWO COLUMN LAYOUT -- stacks on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* LEFT: PROJECT HEALTH MATRIX */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Project Health Matrix
            </h2>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 sm:p-6">
              <div className="space-y-6">
                {projectHealth.it.length > 0 && (
                  <ProjectSection
                    label="IT Services"
                    count={projectHealth.it.length}
                    labelColor="text-blue-500"
                    projects={projectHealth.it}
                    hoveredProject={hoveredProject}
                    onHover={setHoveredProject}
                  />
                )}
                {projectHealth.si.length > 0 && (
                  <ProjectSection
                    label="Systems Integration"
                    count={projectHealth.si.length}
                    labelColor="text-cyan-500"
                    projects={projectHealth.si}
                    hoveredProject={hoveredProject}
                    onHover={setHoveredProject}
                  />
                )}
                {projectHealth.ga.length > 0 && (
                  <ProjectSection
                    label="G&A"
                    count={projectHealth.ga.length}
                    labelColor="text-orange-500"
                    projects={projectHealth.ga}
                    hoveredProject={hoveredProject}
                    onHover={setHoveredProject}
                  />
                )}

                {/* Empty state */}
                {projectHealth.it.length === 0 && projectHealth.si.length === 0 && projectHealth.ga.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No active projects found.
                  </p>
                )}

                {/* Legend */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded" />
                    <span className="text-gray-500 dark:text-gray-400">On Track</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded" />
                    <span className="text-gray-500 dark:text-gray-400">Watch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span className="text-gray-500 dark:text-gray-400">Over Budget</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: UTILIZATION & HIGHLIGHTS */}
          <div className="space-y-6 lg:space-y-8">
            {/* Utilization Chart */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Utilization by Department
              </h2>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 sm:p-6">
                {utilizationChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={utilizationChartData}>
                      <XAxis
                        dataKey="name"
                        stroke="currentColor"
                        className="text-gray-400"
                        tick={{ fill: '#9CA3AF' }}
                        axisLine={{ stroke: '#D1D5DB' }}
                        tickLine={{ stroke: '#D1D5DB' }}
                      />
                      <YAxis
                        stroke="currentColor"
                        className="text-gray-400"
                        tick={{ fill: '#9CA3AF' }}
                        axisLine={{ stroke: '#D1D5DB' }}
                        tickLine={{ stroke: '#D1D5DB' }}
                        domain={[0, 140]}
                      />
                      <Tooltip content={<UtilizationTooltip />} cursor={{ fill: 'rgba(107,114,128,0.1)' }} />
                      <ReferenceLine
                        y={100}
                        stroke="#ef4444"
                        strokeDasharray="6 4"
                        label={{
                          value: '100% capacity',
                          position: 'right',
                          fill: '#ef4444',
                          fontSize: 11,
                        }}
                      />
                      <Bar dataKey="utilization" radius={[8, 8, 0, 0]}>
                        {utilizationChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarFill(entry.utilization)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No utilization data available.
                  </p>
                )}
              </div>
            </div>

            {/* Recent Highlights */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Recent Highlights
              </h2>
              <div className="space-y-2">
                {highlights.map((highlight) => (
                  <HighlightCard key={highlight.id} highlight={highlight} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --------------- Sub-components ---------------

function DataStatusBanner({
  dataStatus,
  fetchedAt,
  errors,
}: {
  dataStatus: 'live' | 'partial'
  fetchedAt: string
  errors: string[]
}) {
  if (dataStatus === 'live') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Live Data — All metrics sourced from ConnectWise in real time.
        </p>
        <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 flex-shrink-0">
          {formatTimeAgo(fetchedAt)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50">
      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Partial Data — Some data sources failed to load.
        </p>
        {errors.length > 0 && (
          <ul className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function DepartmentCard({
  dept,
  onSelect,
}: {
  dept: DepartmentPerformance
  onSelect: () => void
}) {
  const colors = DEPT_COLORS[dept.id] ?? { gradient: 'from-gray-600 to-gray-700', accent: 'bg-gray-500' }

  return (
    <div
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className={`h-1 bg-gradient-to-r ${colors.gradient}`} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {dept.name}
          </h3>
          <TrendingUp className="w-4 h-4 text-gray-400" />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Tickets</span>
            <span className="text-gray-900 dark:text-white font-medium">{dept.tickets}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Projects</span>
            <span className="text-gray-900 dark:text-white font-medium">{dept.projects}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Members</span>
            <span className="text-gray-900 dark:text-white font-medium">{dept.members}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function HighlightCard({ highlight }: { highlight: ExecutiveHighlight }) {
  const IconComponent = HIGHLIGHT_ICONS[highlight.type] ?? Info
  const colorClass = HIGHLIGHT_COLORS[highlight.type] ?? 'text-gray-400'

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors flex gap-4">
      <IconComponent className={`${colorClass} w-5 h-5 mt-0.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {highlight.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {highlight.subtitle}
        </p>
      </div>
    </div>
  )
}

// --------------- Sub-component: Project Section ---------------

interface ProjectSectionProps {
  label: string
  count: number
  labelColor: string
  projects: ProjectHealthEntry[]
  hoveredProject: string | null
  onHover: (id: string | null) => void
}

function ProjectSection({
  label,
  count,
  labelColor,
  projects,
  hoveredProject,
  onHover,
}: ProjectSectionProps) {
  return (
    <div>
      <h3 className={`text-sm font-semibold ${labelColor} mb-3`}>
        {label} ({count} projects)
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {projects.map((proj) => {
          const projKey = String(proj.id)
          // Truncate name for the tile: use first word or first 12 chars
          const shortName = proj.name.length > 12
            ? proj.name.slice(0, 12).trim()
            : proj.name.split(' ')[0]

          return (
            <div
              key={projKey}
              className={`${getStatusColor(proj.status)} rounded p-2 text-xs font-medium text-white text-center cursor-pointer transition-all hover:shadow-lg ${
                hoveredProject === projKey ? 'ring-2 ring-white/50 scale-105' : ''
              }`}
              title={`${proj.name} - ${getStatusLabel(proj.status)} (${proj.utilizationPct}% of budget)`}
              onMouseEnter={() => onHover(projKey)}
              onMouseLeave={() => onHover(null)}
            >
              {shortName}
            </div>
          )
        })}
      </div>
    </div>
  )
}
