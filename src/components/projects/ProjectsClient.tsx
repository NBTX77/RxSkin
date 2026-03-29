'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDepartment } from '@/components/department/DepartmentProvider'
import { ProjectKanban } from './ProjectKanban'
import { ProjectFinancialTable } from './ProjectFinancialTable'
import { ProjectPortfolioView } from './ProjectPortfolioView'
import { ProjectListReadOnly } from './ProjectListReadOnly'
import { ProjectDetailOverlay } from './ProjectDetailOverlay'
import { ProjectCard } from './ProjectCard'
import { Search, SlidersHorizontal, FolderKanban, Table2, LayoutGrid, CheckCircle2 } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import type { Project, DepartmentCode } from '@/types'

type ViewMode = 'kanban' | 'table' | 'list' | 'portfolio'

const DEPT_DEFAULT_VIEW: Record<DepartmentCode, ViewMode> = {
  IT: 'kanban',
  SI: 'kanban',
  AM: 'list',
  GA: 'table',
  LT: 'portfolio',
}

export function ProjectsClient() {
  const { department, isLeadership } = useDepartment()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(
    DEPT_DEFAULT_VIEW[department] || 'kanban'
  )
  const [showCompleted, setShowCompleted] = useState(false)

  // Update default view and reset showCompleted when department changes
  useEffect(() => {
    setViewMode(DEPT_DEFAULT_VIEW[department] || 'kanban')
    setShowCompleted(false)
  }, [department])

  // Reset showCompleted when switching view modes
  useEffect(() => {
    setShowCompleted(false)
  }, [viewMode])

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        // LT sees all projects; other departments filter to their own
        if (!isLeadership) {
          params.set('department', department)
        }
        if (search) params.set('search', search)

        const response = await fetch(`/api/projects?${params}`)
        if (!response.ok) throw new Error('Failed to load projects')
        const data = await response.json()
        setProjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [department, isLeadership, search])

  // Filter projects locally by search (for instant feedback)
  const filteredProjects = useMemo(() => {
    if (!search) return projects
    const q = search.toLowerCase()
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        String(p.id).includes(q)
    )
  }, [projects, search])

  // Split projects into active (non-completed) and completed for kanban view
  const activeProjects = useMemo(
    () => filteredProjects.filter((p) => !p.status.includes('50')),
    [filteredProjects]
  )
  const completedProjects = useMemo(
    () => filteredProjects.filter((p) => p.status.includes('50')),
    [filteredProjects]
  )

  // Available views depend on department
  const availableViews: { mode: ViewMode; icon: typeof FolderKanban; label: string }[] =
    useMemo(() => {
      const views: { mode: ViewMode; icon: typeof FolderKanban; label: string }[] = []
      if (department === 'IT' || department === 'SI') {
        views.push({ mode: 'kanban', icon: FolderKanban, label: 'Kanban' })
        views.push({ mode: 'table', icon: Table2, label: 'Table' })
        views.push({ mode: 'list', icon: LayoutGrid, label: 'List' })
      } else if (department === 'GA') {
        views.push({ mode: 'table', icon: Table2, label: 'Financial' })
        views.push({ mode: 'list', icon: LayoutGrid, label: 'List' })
      } else if (department === 'LT') {
        views.push({ mode: 'portfolio', icon: LayoutGrid, label: 'Portfolio' })
        views.push({ mode: 'kanban', icon: FolderKanban, label: 'Kanban' })
        views.push({ mode: 'table', icon: Table2, label: 'Financial' })
      } else {
        // AM and fallback
        views.push({ mode: 'list', icon: LayoutGrid, label: 'List' })
        views.push({ mode: 'kanban', icon: FolderKanban, label: 'Kanban' })
      }
      return views
    }, [department])

  return (
    <div className="space-y-4 min-w-0">
      {/* Toolbar: search + filter + completed toggle + view toggles + count */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/50 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Filter</span>
        </button>

        {/* Show Completed toggle — kanban view only */}
        {viewMode === 'kanban' && (
          <button
            onClick={() => setShowCompleted((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showCompleted
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                : 'bg-white dark:bg-gray-900/80 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700/50 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <CheckCircle2 size={14} />
            <span className="hidden sm:inline">Completed</span>
            {!showCompleted && completedProjects.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-[10px] font-semibold">
                {completedProjects.length}
              </span>
            )}
          </button>
        )}

        {/* View mode toggles */}
        {availableViews.length > 1 && (
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/50 rounded-lg p-1">
            {availableViews.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        )}

        <span className="text-xs text-gray-500 ml-auto">
          {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm">Loading projects...</span>
          </div>
        </div>
      )}

      {/* Content — department-aware rendering */}
      {!loading && !error && (
        <>
          {viewMode === 'kanban' && (
            <ErrorBoundary section="Project Kanban">
              <div className="-mx-4 lg:-mx-6 overflow-x-auto">
                <div className="px-4 lg:px-6">
                  <ProjectKanban
                    projects={activeProjects}
                    onProjectClick={setSelectedProjectId}
                  />
                </div>
              </div>

              {/* Completed projects grid — shown when toggle is active */}
              {showCompleted && completedProjects.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Completed
                    </h3>
                    <span className="text-xs text-gray-500">
                      ({completedProjects.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {completedProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={() => setSelectedProjectId(project.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {showCompleted && completedProjects.length === 0 && (
                <div className="mt-4 text-center py-8">
                  <p className="text-sm text-gray-500">No completed projects</p>
                </div>
              )}
            </ErrorBoundary>
          )}

          {viewMode === 'table' && (
            <ErrorBoundary section="Project Financials">
              <ProjectFinancialTable
                projects={filteredProjects}
                onProjectClick={setSelectedProjectId}
              />
            </ErrorBoundary>
          )}

          {viewMode === 'list' && (
            <ErrorBoundary section="Project List">
              <ProjectListReadOnly
                projects={filteredProjects}
                onProjectClick={setSelectedProjectId}
              />
            </ErrorBoundary>
          )}

          {viewMode === 'portfolio' && (
            <ErrorBoundary section="Project Portfolio">
              <ProjectPortfolioView
                projects={filteredProjects}
                onProjectClick={setSelectedProjectId}
              />
            </ErrorBoundary>
          )}
        </>
      )}

      {/* Detail overlay */}
      <ProjectDetailOverlay
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </div>
  )
}
