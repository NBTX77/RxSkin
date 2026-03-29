'use client'

import type { Project } from '@/types'
import { Building2, User, Clock } from 'lucide-react'
import { BudgetGauge } from './BudgetGauge'

interface ProjectListReadOnlyProps {
  projects: Project[]
  onProjectClick: (id: number) => void
}

const STATUS_DOT: Record<string, string> = {
  New: 'bg-blue-400',
  'Incomplete Handoff': 'bg-orange-400',
  'Assigned to PM': 'bg-yellow-400',
  'In Progress': 'bg-cyan-400',
  Completed: 'bg-green-400',
}

function getStatusDot(status: string): string {
  for (const [key, color] of Object.entries(STATUS_DOT)) {
    if (status.toLowerCase().includes(key.toLowerCase())) return color
  }
  return 'bg-gray-400'
}

export function ProjectListReadOnly({
  projects,
  onProjectClick,
}: ProjectListReadOnlyProps) {
  return (
    <div className="space-y-2">
      {projects.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-500">
          No projects found
        </div>
      ) : (
        projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onProjectClick(project.id)}
            className="w-full text-left bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 hover:bg-gray-900/95 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">
                  {project.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {project.company}
                  </span>
                  {project.manager && (
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {project.manager}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className={`w-2 h-2 rounded-full ${getStatusDot(
                    project.status
                  )}`}
                />
                <span className="text-xs text-gray-400">{project.status}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex-1">
                <BudgetGauge
                  budgetHours={project.budgetHours}
                  actualHours={project.actualHours}
                  compact
                />
              </div>
              {project.estimatedEnd && (
                <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                  <Clock size={12} />
                  Due{' '}
                  {new Date(project.estimatedEnd).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  )
}
