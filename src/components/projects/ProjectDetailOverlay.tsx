'use client'

import { useState, useEffect } from 'react'
import type { Project } from '@/types'
import { X, FolderKanban, Building2, User, DollarSign } from 'lucide-react'
import { BudgetGauge } from './BudgetGauge'

interface ProjectDetailOverlayProps {
  projectId: number | null
  onClose: () => void
}

export function ProjectDetailOverlay({ projectId, onClose }: ProjectDetailOverlayProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) {
      setProject(null)
      return
    }

    const fetchProject = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) {
          throw new Error('Failed to load project')
        }
        const data = await response.json()
        setProject(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  if (!projectId) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Project Details"
        className="absolute right-0 top-0 h-full w-full max-w-md bg-gray-900/95 backdrop-blur-lg border-l border-gray-200 dark:border-gray-800 shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800/50 bg-white dark:bg-gray-900/80 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Project Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {loading && (
            <div className="space-y-4">
              <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-2/3" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          {project && (
            <>
              {/* Header: Name, Company, Status, Manager */}
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{project.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <Building2 size={14} />
                  <span>{project.company}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                    project.status.includes('10') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    project.status.includes('20') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    project.status.includes('30') ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                    project.status.includes('31') || project.status.includes('33') || project.status.includes('34') ?
                      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                    project.status.includes('50') ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
                  }`}>
                    {project.status}
                  </span>
                  {project.manager && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <User size={14} />
                      <span>{project.manager}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Budget Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Budget & Hours</h3>
                <BudgetGauge
                  budgetHours={project.budgetHours}
                  actualHours={project.actualHours}
                />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-gray-100 dark:bg-gray-800/50 rounded p-2 text-center">
                    <p className="text-xs text-gray-500 mb-1">Budgeted</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{Math.round(project.budgetHours)}h</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800/50 rounded p-2 text-center">
                    <p className="text-xs text-gray-500 mb-1">Actual</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{Math.round(project.actualHours)}h</p>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Project Details</h3>
                <div className="space-y-2 text-sm">
                  {project.board && (
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <FolderKanban size={16} className="text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Board</p>
                        <p className="text-sm text-gray-800 dark:text-gray-100">{project.board}</p>
                      </div>
                    </div>
                  )}
                  {project.billingMethod && (
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <DollarSign size={16} className="text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Billing Method</p>
                        <p className="text-sm text-gray-800 dark:text-gray-100">{project.billingMethod}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates Section */}
              {(project.estimatedStart || project.estimatedEnd || project.actualStart || project.actualEnd) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Timeline</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {project.estimatedStart && (
                      <div className="bg-gray-100 dark:bg-gray-800/50 rounded p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Est. Start</p>
                        <p className="text-sm text-gray-800 dark:text-gray-100">
                          {new Date(project.estimatedStart).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                    {project.estimatedEnd && (
                      <div className="bg-gray-100 dark:bg-gray-800/50 rounded p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Est. End</p>
                        <p className="text-sm text-gray-800 dark:text-gray-100">
                          {new Date(project.estimatedEnd).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                    {project.actualStart && (
                      <div className="bg-gray-100 dark:bg-gray-800/50 rounded p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Started</p>
                        <p className="text-sm text-gray-800 dark:text-gray-100">
                          {new Date(project.actualStart).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                    {project.actualEnd && (
                      <div className="bg-gray-100 dark:bg-gray-800/50 rounded p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Completed</p>
                        <p className="text-sm text-gray-800 dark:text-gray-100">
                          {new Date(project.actualEnd).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
