'use client'

import { useDepartmentsData } from '@/hooks/useDepartmentsData'
import type { DepartmentData } from '@/hooks/useDepartmentsData'
import { KPICard } from '@/components/ui/KPICard'
import { KPIStrip } from '@/components/ui/KPIStrip'
import { getPriorityBadgeStyle, getStatusBadgeStyle, BADGE_BASE_CLASSES } from '@/lib/ui/badgeStyles'
import { Ticket, FolderKanban, Users, Gauge, RefreshCw, AlertCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ── Department Color Map ────────────────────────────────────

const DEPT_BORDER_COLORS: Record<string, string> = {
  blue: 'border-t-blue-500',
  cyan: 'border-t-cyan-500',
  emerald: 'border-t-emerald-500',
  orange: 'border-t-orange-500',
  purple: 'border-t-purple-500',
}

const DEPT_TEXT_COLORS: Record<string, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  orange: 'text-orange-600 dark:text-orange-400',
  purple: 'text-purple-600 dark:text-purple-400',
}

const DEPT_BAR_FILLS: Record<string, string> = {
  blue: '#3b82f6',
  cyan: '#06b6d4',
  emerald: '#10b981',
  orange: '#f97316',
  purple: '#8b5cf6',
}

const DEPT_ACCENT_BG: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-500/10',
  cyan: 'bg-cyan-50 dark:bg-cyan-500/10',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10',
  orange: 'bg-orange-50 dark:bg-orange-500/10',
  purple: 'bg-purple-50 dark:bg-purple-500/10',
}

// ── Utilization Bar ─────────────────────────────────────────

function UtilizationBar({ pct, color }: { pct: number; color: string }) {
  const barColor = pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : `bg-${color}-500`
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className={`${barColor} h-2 rounded-full transition-all`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

// ── Loading Skeleton ────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI strip skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 h-24" />
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl h-48" />
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl h-64" />
    </div>
  )
}

// ── Status Bar Chart (horizontal stacked) ───────────────────

function TicketStatusBar({ ticketsByStatus }: { ticketsByStatus: Record<string, number> }) {
  const entries = Object.entries(ticketsByStatus).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((sum, [, count]) => sum + count, 0)
  if (total === 0) return <p className="text-sm text-gray-500">No open tickets</p>

  const STATUS_COLORS: Record<string, string> = {
    'New': '#3b82f6',
    'In Progress': '#06b6d4',
    'Waiting on Client': '#eab308',
    'Scheduled': '#8b5cf6',
    'Escalated': '#ef4444',
    'Completed': '#22c55e',
    'Closed': '#6b7280',
  }

  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {entries.map(([status, count]) => (
          <div
            key={status}
            title={`${status}: ${count}`}
            style={{
              width: `${(count / total) * 100}%`,
              backgroundColor: STATUS_COLORS[status] ?? '#9ca3af',
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {entries.map(([status, count]) => (
          <span key={status} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: STATUS_COLORS[status] ?? '#9ca3af' }}
            />
            {status}: {count}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Department Card ─────────────────────────────────────────

function DepartmentCard({ dept }: { dept: DepartmentData }) {
  const borderColor = DEPT_BORDER_COLORS[dept.color] ?? 'border-t-gray-500'
  const textColor = DEPT_TEXT_COLORS[dept.color] ?? 'text-gray-600 dark:text-gray-400'

  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl border-t-4 ${borderColor} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${textColor}`}>{dept.name}</h3>
        <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{dept.code}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dept.openTickets}</p>
          <p className="text-xs text-gray-500">Tickets</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dept.activeProjects}</p>
          <p className="text-xs text-gray-500">Projects</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dept.members}</p>
          <p className="text-xs text-gray-500">Members</p>
        </div>
      </div>

      {/* Utilization bar */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-600 dark:text-gray-400">Budget Utilization</span>
        <span className="text-xs font-semibold text-gray-900 dark:text-white">{dept.utilizationPct}%</span>
      </div>
      <UtilizationBar pct={dept.utilizationPct} color={dept.color} />

      {/* Project health mini badges */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-full">
          {dept.projectsByHealth.onTrack} on track
        </span>
        {dept.projectsByHealth.watch > 0 && (
          <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 px-2 py-0.5 rounded-full">
            {dept.projectsByHealth.watch} watch
          </span>
        )}
        {dept.projectsByHealth.overBudget > 0 && (
          <span className="text-xs bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 px-2 py-0.5 rounded-full">
            {dept.projectsByHealth.overBudget} over
          </span>
        )}
      </div>
    </div>
  )
}

// ── Department Detail Section ───────────────────────────────

function DepartmentDetail({ dept }: { dept: DepartmentData }) {
  const textColor = DEPT_TEXT_COLORS[dept.color] ?? 'text-gray-600 dark:text-gray-400'
  const accentBg = DEPT_ACCENT_BG[dept.color] ?? 'bg-gray-50 dark:bg-gray-800/80'

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-5">
      <div className={`flex items-center gap-3 mb-4 ${accentBg} -mx-5 -mt-5 px-5 pt-4 pb-3 rounded-t-xl`}>
        <h3 className={`text-base font-bold ${textColor}`}>{dept.name}</h3>
        <span className="text-xs text-gray-500">
          {dept.openTickets} tickets / {dept.activeProjects} projects
        </span>
      </div>

      {/* Ticket status breakdown */}
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Ticket Status Breakdown</p>
        <TicketStatusBar ticketsByStatus={dept.ticketsByStatus} />
      </div>

      {/* Recent tickets */}
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Recent Tickets</p>
        {dept.recentTickets.length === 0 ? (
          <p className="text-sm text-gray-500">No recent tickets</p>
        ) : (
          <div className="space-y-2">
            {dept.recentTickets.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <span className="text-xs font-mono text-gray-500 shrink-0">#{t.id}</span>
                <span className="text-sm text-gray-900 dark:text-white truncate flex-1">{t.summary}</span>
                <span className={`${BADGE_BASE_CLASSES} ${getStatusBadgeStyle(t.status)} shrink-0`}>
                  {t.status}
                </span>
                <span className={`${BADGE_BASE_CLASSES} ${getPriorityBadgeStyle(t.priority)} shrink-0`}>
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────

export function DepartmentsDashboard() {
  const { data, isLoading, isError, error, refetch } = useDepartmentsData()

  if (isLoading) return <Skeleton />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to Load Departments</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 max-w-md">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  const departments = data?.departments ?? []

  // Aggregate KPIs
  const totalTickets = departments.reduce((s, d) => s + d.openTickets, 0)
  const totalProjects = departments.reduce((s, d) => s + d.activeProjects, 0)
  const totalMembers = departments.reduce((s, d) => s + d.members, 0)
  const totalBudget = departments.reduce((s, d) => s + d.budgetHours, 0)
  const totalActual = departments.reduce((s, d) => s + d.actualHours, 0)
  const overallUtil = totalBudget > 0 ? Math.min(100, Math.round((totalActual / totalBudget) * 100)) : 0

  // Chart data for cross-department comparison
  const utilizationChartData = departments
    .filter((d) => d.code !== 'LT') // LT aggregates all, skip in comparison
    .map((d) => ({
      name: d.code,
      utilization: d.utilizationPct,
      color: DEPT_BAR_FILLS[d.color] ?? '#6b7280',
    }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Cross-department performance and utilization overview
          </p>
        </div>
        {data?.dataStatus === 'partial' && (
          <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 px-2 py-1 rounded-full">
            Partial Data
          </span>
        )}
      </div>

      {/* KPI Strip */}
      <KPIStrip>
        <KPICard icon={Ticket} color="bg-blue-500" label="Open Tickets" value={totalTickets} />
        <KPICard icon={FolderKanban} color="bg-cyan-500" label="Active Projects" value={totalProjects} />
        <KPICard icon={Gauge} color="bg-emerald-500" label="Overall Utilization" value={`${overallUtil}%`} />
        <KPICard icon={Users} color="bg-purple-500" label="Total Members" value={totalMembers} />
      </KPIStrip>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <DepartmentCard key={dept.code} dept={dept} />
        ))}
      </div>

      {/* Department Detail Sections */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Department Details</h2>
        {departments
          .filter((d) => d.openTickets > 0 || d.activeProjects > 0)
          .map((dept) => (
            <DepartmentDetail key={dept.code} dept={dept} />
          ))}
      </div>

      {/* Cross-Department Utilization Comparison */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Budget Utilization by Department
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilizationChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Utilization']}
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #1f2937)',
                  border: '1px solid var(--tooltip-border, #374151)',
                  borderRadius: '8px',
                  color: 'var(--tooltip-text, #f9fafb)',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="utilization" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {utilizationChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
