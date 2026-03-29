'use client'

import type { Project } from '@/types'
import { FolderKanban } from 'lucide-react'
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
    name: '10 New',
    color: 'blue',
    statusFilter: (status) => status.includes('10'),
  },
  {
    id: 'handoff',
    name: '20 Incomplete handoff',
    color: 'orange',
    statusFilter: (status) => status.includes('20'),
  },
  {
    id: 'assigned-pm',
    name: '30 Assigned to PM',
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
    name: '50 Completed',
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


export function ProjectKanban({
  projects,
  onProjectClick,
}: ProjectKanbanProps) {
  return (
    <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 px-2 sm:px-4">
      {KANBAN_COLUMNS.map((column) => {
        const columnProjects = projects.filter((p) =>
          column.statusFilter(p.status)
        )

        return (
          <div
            key={column.id}
            className={`min-w-[260px] sm:min-w-[280px] w-[260px] sm:w-[280px] flex-shrink-0 bg-gray-900/80 rounded-xl border border-gray-700/50 p-3 ${COLUMN_ACCENT[column.color]}`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <span className={`${BADGE_BASE_CLASSES} ${getProjectStageStyle(column.name)}`}>
                {column.name}
              </span>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-800/80 text-xs font-medium text-gray-200">
                {columnProjects.length}
              </span>
            </div>

            {/* Cards container */}
            <div className="flex flex-col gap-2">
              {columnProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FolderKanban className="text-gray-600 mb-1.5" size={24} />
                  <p className="text-xs text-gray-600">No projects</p>
                </div>
              ) : (
                columnProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => onProjectClick(project.id)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
