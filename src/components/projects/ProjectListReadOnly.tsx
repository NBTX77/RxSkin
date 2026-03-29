'use client'

import type { Project } from '@/types'
import { Building2, User, Clock, FolderKanban } from 'lucide-react'
import { BudgetGauge } from './BudgetGauge'
import { getProjectStageStyle, BADGE_BASE_CLASSES } from '@/lib/ui/badgeStyles'
import { EmptyState } from '@/components/ui/EmptyState'

interface ProjectListReadOnlyProps {
  projects: Project[]
  onProjectClick: (id: number) => void
}

export function ProjectListReadOnly({
  projects,
  onProjectClick,
}: ProjectListReadOnlyProps) {
  return (
    <div className="space-y-2">
      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects found" description="Try adjusting your filters." />
      ) : (
        projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onProjectClick(project.id)}
            className="w-full text-left bg-white dark:bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/95 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
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
              <span className={`${BADGE_BASE_CLASSES} ${getProjectStageStyle(project.status)} flex-shrink-0`}>
                {project.status}
              </span>
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
