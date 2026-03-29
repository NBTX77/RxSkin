'use client'

import { useState } from 'react'
import type { Project } from '@/types'
import { FolderKanban, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { ProjectCard } from './ProjectCard'
import { getProjectStageStyle, BADGE_BASE_CLASSES } from '@/lib/ui/badgeStyles'

interface ProjectKanbanProps {
  projects: Project[]
  onProjectClick: (id: number) => void
  onStatusChange?: (projectId: number, newStatusName: string) => void
}

interface KanbanColumn {
  id: string
  name: string
  color: string
  statusFilter: (status: string) => boolean
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'new',
    name: 'New',
    color: 'blue',
    statusFilter: (status) => status.includes('10'),
  },
  {
    id: 'handoff',
    name: 'Incomplete Handoff',
    color: 'orange',
    statusFilter: (status) => status.includes('20'),
  },
  {
    id: 'assigned-pm',
    name: 'Assigned to PM',
    color: 'yellow',
    statusFilter: (status) => status.includes('30'),
  },
  {
    id: 'work-stage',
    name: 'Work Stage',
    color: 'cyan',
    statusFilter: (status) =>
      status.includes('31') || status.includes('33') || status.includes('34'),
  },
  {
    id: 'completed',
    name: 'Completed',
    color: 'green',
    statusFilter: (status) => status.includes('50'),
  },
]

const COLUMN_ACCENT: Record<string, string> = {
  blue: 'border-t-2 border-t-blue-500',
  orange: 'border-t-2 border-t-orange-500',
  yellow: 'border-t-2 border-t-yellow-500',
  cyan: 'border-t-2 border-t-cyan-500',
  green: 'border-t-2 border-t-green-500',
}


const COMPLETED_COLLAPSE_THRESHOLD = 5

export function ProjectKanban({
  projects,
  onProjectClick,
}: ProjectKanbanProps) {
  const [completedExpanded, setCompletedExpanded] = useState(false)

  return (
    <div className="flex gap-3 pb-4">
      {KANBAN_COLUMNS.map((column) => {
        const columnProjects = projects.filter((p) =>
          column.statusFilter(p.status)
        )

        const isCompleted = column.id === 'completed'
        const shouldCollapse = isCompleted && columnProjects.length > COMPLETED_COLLAPSE_THRESHOLD && !completedExpanded
        const visibleProjects = shouldCollapse
          ? columnProjects.slice(0, COMPLETED_COLLAPSE_THRESHOLD)
          : columnProjects
        const hiddenCount = columnProjects.length - COMPLETED_COLLAPSE_THRESHOLD

        return (
          <div
            key={column.id}
            className={`min-w-[260px] sm:min-w-[280px] w-[260px] sm:w-[280px] flex-shrink-0 bg-white dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-700/50 p-3 ${COLUMN_ACCENT[column.color]}`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                {isCompleted && (
                  <CheckCircle2 size={14} className="text-green-500" />
                )}
                <span className={`${BADGE_BASE_CLASSES} ${getProjectStageStyle(column.name)}`}>
                  {column.name}
                </span>
              </div>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-800/80 text-xs font-medium text-gray-800 dark:text-gray-200">
                {columnProjects.length}
              </span>
            </div>

            {/* Cards container */}
            <div className={`flex flex-col gap-2 ${isCompleted ? 'max-h-[600px] overflow-y-auto' : ''}`}>
              {columnProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FolderKanban className="text-gray-400 dark:text-gray-600 mb-1.5" size={24} />
                  <p className="text-xs text-gray-500 dark:text-gray-600">No projects</p>
                </div>
              ) : (
                <>
                  {visibleProjects.map((project) => (
                    <div
                      key={project.id}
                      className={isCompleted ? 'opacity-75 border-l-2 border-l-green-500 rounded-l-none' : ''}
                    >
                      <ProjectCard
                        project={project}
                        onClick={() => onProjectClick(project.id)}
                      />
                    </div>
                  ))}

                  {/* Show more / Show less toggle for Completed column */}
                  {isCompleted && columnProjects.length > COMPLETED_COLLAPSE_THRESHOLD && (
                    <button
                      onClick={() => setCompletedExpanded((prev) => !prev)}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                    >
                      {completedExpanded ? (
                        <>
                          <ChevronUp size={14} />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} />
                          Show {hiddenCount} more
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
