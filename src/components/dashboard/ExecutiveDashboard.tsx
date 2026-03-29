'use client'

// ============================================================
// ExecutiveDashboard — RX Skin
// Leadership Team (LT) executive dashboard with KPIs,
// department performance, project health matrix, utilization,
// and recent highlights. Uses demo/static data.
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
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  DollarSign,
  Users,
  Zap,
  Target,
  Info,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// --------------- Types ---------------

type ProjectStatus = 'on-track' | 'watch' | 'over-budget'
type TrendDirection = 'up' | 'down' | 'neutral'

interface KPI {
  label: string
  value: string | number
  color: string
  icon: LucideIcon
}

interface DepartmentCard {
  id: string
  name: string
  color: string
  accent: string
  tickets?: number
  projects?: number
  members: number
  trend: TrendDirection
  trendValue: string
  opportunities?: number
  agreements?: number
  procurementTickets?: number
  openInvoices?: string
}

interface ProjectEntry {
  id: string
  name: string
  status: ProjectStatus
}

interface ProjectMatrix {
  it: ProjectEntry[]
  si: ProjectEntry[]
  ga: ProjectEntry[]
}

interface UtilizationEntry {
  name: string
  utilization: number
}

interface Highlight {
  id: number
  type: string
  icon: LucideIcon
  title: string
  subtitle: string
  color: string
}

// --------------- Demo Data ---------------

const kpis: KPI[] = [
  { label: 'Open Tickets', value: 173, color: 'bg-blue-500', icon: Zap },
  { label: 'Active Projects', value: 53, color: 'bg-cyan-500', icon: Target },
  { label: 'Monthly Revenue', value: '$148K', color: 'bg-emerald-500', icon: DollarSign },
  { label: 'Utilization Rate', value: '76%', color: 'bg-yellow-500', icon: Users },
  { label: 'Projects Over Budget', value: 4, color: 'bg-red-500', icon: AlertCircle },
  { label: 'SLA Compliance', value: '94%', color: 'bg-emerald-500', icon: CheckCircle2 },
]

const departments: DepartmentCard[] = [
  {
    id: 'it',
    name: 'IT Services',
    color: 'from-blue-600 to-blue-700',
    accent: 'bg-blue-500',
    tickets: 141,
    projects: 16,
    members: 80,
    trend: 'up',
    trendValue: '+12%',
  },
  {
    id: 'si',
    name: 'Systems Integration',
    color: 'from-cyan-600 to-cyan-700',
    accent: 'bg-cyan-500',
    tickets: 23,
    projects: 23,
    members: 38,
    trend: 'neutral',
    trendValue: '+2%',
  },
  {
    id: 'am',
    name: 'Account Management',
    color: 'from-emerald-600 to-emerald-700',
    accent: 'bg-emerald-500',
    opportunities: 4,
    agreements: 160,
    members: 17,
    trend: 'up',
    trendValue: '+8%',
  },
  {
    id: 'ga',
    name: 'G&A',
    color: 'from-orange-600 to-orange-700',
    accent: 'bg-orange-500',
    procurementTickets: 5,
    projects: 14,
    openInvoices: '$287K',
    members: 8,
    trend: 'down',
    trendValue: '+18% over',
  },
]

const projectMatrix: ProjectMatrix = {
  it: [
    { id: 'p001', name: 'Cloud Migration', status: 'on-track' },
    { id: 'p002', name: 'Security Audit', status: 'on-track' },
    { id: 'p003', name: 'Network Upgrade', status: 'watch' },
    { id: 'p004', name: 'Backup System', status: 'on-track' },
    { id: 'p005', name: 'Disaster Recovery', status: 'watch' },
    { id: 'p006', name: 'Email Migration', status: 'on-track' },
  ],
  si: [
    { id: 'p007', name: 'ERP Implementation', status: 'on-track' },
    { id: 'p008', name: 'CRM Customization', status: 'on-track' },
    { id: 'p009', name: 'API Integration', status: 'on-track' },
    { id: 'p010', name: 'Database Upgrade', status: 'watch' },
    { id: 'p011', name: 'Mobile App Dev', status: 'over-budget' },
    { id: 'p012', name: 'Data Migration', status: 'over-budget' },
  ],
  ga: [
    { id: 'p013', name: 'Vendor Mgmt', status: 'over-budget' },
    { id: 'p014', name: 'Compliance', status: 'over-budget' },
    { id: 'p015', name: 'Procurement', status: 'watch' },
  ],
}

const utilizationData: UtilizationEntry[] = [
  { name: 'IT', utilization: 76 },
  { name: 'SI', utilization: 73 },
  { name: 'AM', utilization: 68 },
  { name: 'G&A', utilization: 127 },
]

const highlights: Highlight[] = [
  {
    id: 1,
    type: 'success',
    icon: CheckCircle2,
    title: 'Project #788 completed',
    subtitle: 'City of Helotes infrastructure upgrade',
    color: 'text-emerald-400',
  },
  {
    id: 2,
    type: 'alert',
    icon: AlertCircle,
    title: 'G&A projects 127% over budget',
    subtitle: 'Requires immediate review and reallocation',
    color: 'text-red-400',
  },
  {
    id: 3,
    type: 'warning',
    icon: Clock,
    title: '6 incomplete handoffs pending',
    subtitle: 'Follow-up required from project managers',
    color: 'text-yellow-400',
  },
  {
    id: 4,
    type: 'new',
    icon: Plus,
    title: 'New MSP agreement signed',
    subtitle: 'Hill Electric Services — 36-month contract',
    color: 'text-blue-400',
  },
  {
    id: 5,
    type: 'critical',
    icon: Clock,
    title: 'SLA breach risk — 3 tickets aging >48h',
    subtitle: 'Escalate to senior technicians immediately',
    color: 'text-orange-400',
  },
]

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

// --------------- Component ---------------

export function ExecutiveDashboard() {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)
  const [, setSelectedDept] = useState<string | null>(null)
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* DEMO DATA BANNER */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Demo Data — Executive metrics shown are static sample data for layout preview.
          </p>
        </div>

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Executive Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last refreshed: 2 min ago
          </p>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {kpis.map((kpi) => {
            const IconComponent = kpi.icon
            return (
              <div
                key={kpi.label}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`${kpi.color} p-2 rounded-lg`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {kpi.value}
                </p>
              </div>
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
              <div
                key={dept.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => setSelectedDept(dept.id)}
              >
                {/* Color accent bar */}
                <div className={`h-1 bg-gradient-to-r ${dept.color}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {dept.name}
                    </h3>
                    {dept.trend === 'up' && (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    )}
                    {dept.trend === 'down' && (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    {dept.trend === 'neutral' && (
                      <span className="w-4 h-4 text-gray-400 text-sm">&#8594;</span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    {dept.tickets !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Tickets</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {dept.tickets}
                        </span>
                      </div>
                    )}
                    {dept.procurementTickets !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Procurement</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {dept.procurementTickets}
                        </span>
                      </div>
                    )}
                    {dept.opportunities !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Opportunities</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {dept.opportunities}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        {dept.projects ? 'Projects' : 'Agreements'}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {dept.projects ?? dept.agreements}
                      </span>
                    </div>
                    {dept.openInvoices && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Open Invoices</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {dept.openInvoices}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">Members</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {dept.members}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-right">
                    <span
                      className={`text-xs font-semibold ${
                        dept.trendValue.includes('over')
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {dept.trendValue}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TWO COLUMN LAYOUT — stacks on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* LEFT: PROJECT HEALTH MATRIX */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Project Health Matrix
            </h2>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 sm:p-6">
              <div className="space-y-6">
                {/* IT Section */}
                <ProjectSection
                  label="IT Services"
                  count={projectMatrix.it.length}
                  labelColor="text-blue-500"
                  projects={projectMatrix.it}
                  hoveredProject={hoveredProject}
                  onHover={setHoveredProject}
                />

                {/* SI Section */}
                <ProjectSection
                  label="Systems Integration"
                  count={projectMatrix.si.length}
                  labelColor="text-cyan-500"
                  projects={projectMatrix.si}
                  hoveredProject={hoveredProject}
                  onHover={setHoveredProject}
                />

                {/* G&A Section */}
                <ProjectSection
                  label="G&A"
                  count={projectMatrix.ga.length}
                  labelColor="text-orange-500"
                  projects={projectMatrix.ga}
                  hoveredProject={hoveredProject}
                  onHover={setHoveredProject}
                />

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
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={utilizationData}>
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
                      {utilizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarFill(entry.utilization)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Highlights */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Recent Highlights
              </h2>
              <div className="space-y-2">
                {highlights.map((highlight) => {
                  const IconComponent = highlight.icon
                  return (
                    <div
                      key={highlight.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors flex gap-4"
                    >
                      <IconComponent
                        className={`${highlight.color} w-5 h-5 mt-0.5 flex-shrink-0`}
                      />
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
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --------------- Sub-component: Project Section ---------------

interface ProjectSectionProps {
  label: string
  count: number
  labelColor: string
  projects: ProjectEntry[]
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
        {projects.map((proj) => (
          <div
            key={proj.id}
            className={`${getStatusColor(proj.status)} rounded p-2 text-xs font-medium text-white text-center cursor-pointer transition-all hover:shadow-lg ${
              hoveredProject === proj.id ? 'ring-2 ring-white/50 scale-105' : ''
            }`}
            title={`${proj.name} - ${getStatusLabel(proj.status)}`}
            onMouseEnter={() => onHover(proj.id)}
            onMouseLeave={() => onHover(null)}
          >
            {proj.name.split(' ')[0]}
          </div>
        ))}
      </div>
    </div>
  )
}
