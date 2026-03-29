'use client'

import type { Project, DepartmentCode } from '@/types'
import { DEPARTMENTS } from '@/types'
import { BudgetGauge } from './BudgetGauge'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FolderKanban,
} from 'lucide-react'

interface ProjectPortfolioViewProps {
  projects: Project[]
  onProjectClick: (id: number) => void
}

interface DeptSummary {
  code: DepartmentCode
  name: string
  color: string
  projects: Project[]
  totalBudget: number
  totalActual: number
  overBudgetCount: number
  completedCount: number
  activeCount: number
}

function getDeptFromBoard(board: string): DepartmentCode {
  for (const [code, config] of Object.entries(DEPARTMENTS)) {
    if (config.cwBoards.some((b) => board.includes(b.trim()) || b.trim().includes(board))) {
      return code as DepartmentCode
    }
  }
  return 'IT'
}

function getHeatColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500/20 border-red-500/30 text-red-400'
  if (pct >= 80) return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
  if (pct >= 50) return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
  return 'bg-green-500/20 border-green-500/30 text-green-400'
}

export function ProjectPortfolioView({
  projects,
  onProjectClick,
}: ProjectPortfolioViewProps) {
  // Group projects by department
  const deptMap = new Map<DepartmentCode, Project[]>()
  for (const p of projects) {
    const dept = (p.department as DepartmentCode) || getDeptFromBoard(p.board)
    if (!deptMap.has(dept)) deptMap.set(dept, [])
    deptMap.get(dept)!.push(p)
  }

  const deptSummaries: DeptSummary[] = (['IT', 'SI', 'AM', 'GA'] as DepartmentCode[])
    .map((code) => {
      const deptProjects = deptMap.get(code) || []
      const totalBudget = deptProjects.reduce((s, p) => s + p.budgetHours, 0)
      const totalActual = deptProjects.reduce((s, p) => s + p.actualHours, 0)
      const overBudgetCount = deptProjects.filter(
        (p) => p.budgetHours > 0 && p.actualHours > p.budgetHours
      ).length
      const completedCount = deptProjects.filter((p) =>
        p.status.includes('50') || p.closedFlag
      ).length
      const activeCount = deptProjects.length - completedCount

      return {
        code,
        name: DEPARTMENTS[code].name,
        color: DEPARTMENTS[code].color,
        projects: deptProjects,
        totalBudget,
        totalActual,
        overBudgetCount,
        completedCount,
        activeCount,
      }
    })
    .filter((d) => d.projects.length > 0)

  // Global stats
  const totalProjects = projects.length
  const totalBudget = projects.reduce((s, p) => s + p.budgetHours, 0)
  const totalActual = projects.reduce((s, p) => s + p.actualHours, 0)
  const globalPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Executive summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Projects</p>
          <p className="text-2xl font-bold text-white">{totalProjects}</p>
        </div>
        <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Budget Hours</p>
          <p className="text-2xl font-bold text-white">
            {Math.round(totalBudget).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Overall Utilization</p>
          <p
            className={`text-2xl font-bold ${
              globalPct > 100
                ? 'text-red-400'
                : globalPct > 80
                ? 'text-yellow-400'
                : 'text-green-400'
            }`}
          >
            {Math.round(globalPct)}%
          </p>
        </div>
        <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Departments Active</p>
          <p className="text-2xl font-bold text-white">{deptSummaries.length}</p>
        </div>
      </div>

      {/* Department heatmap cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {deptSummaries.map((dept) => {
          const pct =
            dept.totalBudget > 0
              ? (dept.totalActual / dept.totalBudget) * 100
              : 0

          return (
            <div
              key={dept.code}
              className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 space-y-3"
            >
              {/* Dept header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban size={16} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-white">
                    {dept.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {dept.projects.length} projects
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {dept.overBudgetCount > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertTriangle size={12} />
                      {dept.overBudgetCount} over
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle size={12} />
                    {dept.completedCount}
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    <Clock size={12} />
                    {dept.activeCount}
                  </span>
                </div>
              </div>

              {/* Budget bar */}
              <BudgetGauge
                budgetHours={dept.totalBudget}
                actualHours={dept.totalActual}
              />

              {/* Project heatmap tiles */}
              <div className="flex flex-wrap gap-1.5">
                {dept.projects.map((project) => {
                  const projPct =
                    project.budgetHours > 0
                      ? (project.actualHours / project.budgetHours) * 100
                      : 0

                  return (
                    <button
                      key={project.id}
                      onClick={() => onProjectClick(project.id)}
                      title={`${project.name} — ${Math.round(projPct)}% (${Math.round(project.actualHours)}/${Math.round(project.budgetHours)}h)`}
                      className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer hover:opacity-80 transition-opacity truncate max-w-[200px] ${getHeatColor(projPct)}`}
                    >
                      {project.name.length > 25
                        ? project.name.slice(0, 25) + '…'
                        : project.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
