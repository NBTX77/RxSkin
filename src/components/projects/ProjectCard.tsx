'use client'

import { memo } from 'react'
import type { Project } from '@/types'
import { User, Clock } from 'lucide-react'
import { BudgetGauge } from './BudgetGauge'

const STATUS_COLORS: Record<string, string> = {
  '10 New': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  '20 Incomplete handoff': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  '30 Assigned to PM': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  '31 Assigned': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  '33 Assigned': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  '34 Assigned': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  '50 Completed': 'bg-green-500/10 text-green-400 border-green-500/20',
}

function getStatusColor(status: string): string {
  // Check for exact match first
  if (STATUS_COLORS[status]) {
    return STATUS_COLORS[status]
  }
  // Check for pattern matches (e.g., "31 Assigned to..." → cyan)
  if (status.includes('31') || status.includes('33') || status.includes('34')) {
    return STATUS_COLORS['31 Assigned']
  }
  return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
}

function getStatusLabel(status: string): string {
  if (status.includes('10')) return '10 New'
  if (status.includes('20')) return '20 Incomplete handoff'
  if (status.includes('30')) return '30 Assigned to PM'
  if (status.includes('31') || status.includes('33') || status.includes('34')) return 'Work Stage'
  if (status.includes('50')) return '50 Completed'
  return status
}

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

export const ProjectCard = memo(function ProjectCard({ project, onClick }: ProjectCardProps) {
  const statusColor = getStatusColor(project.status)
  const statusLabel = getStatusLabel(project.status)

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 rounded-lg p-3 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800/95 hover:shadow-md hover:shadow-cyan-500/10 transition-all duration-150 cursor-pointer group"
    >
      {/* Header: Project name + status badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 group-hover:text-gray-800 dark:text-gray-100">
          {project.name}
        </h3>
        <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-medium border flex-shrink-0 ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Company name */}
      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
        {project.company}
      </p>

      {/* Manager + time info */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        {project.manager && (
          <span className="flex items-center gap-1 truncate">
            <User size={12} className="text-gray-600 flex-shrink-0" />
            <span className="truncate">{project.manager}</span>
          </span>
        )}
        {project.actualStart && (
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock size={12} className="text-gray-600" />
            <span>{new Date(project.actualStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </span>
        )}
      </div>

      {/* Budget gauge */}
      <BudgetGauge
        budgetHours={project.budgetHours}
        actualHours={project.actualHours}
        compact
      />
    </button>
  )
})
