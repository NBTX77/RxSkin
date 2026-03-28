'use client'

import type { Project } from '@/types'
import { BudgetGauge } from './BudgetGauge'
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

interface ProjectFinancialTableProps {
  projects: Project[]
  onProjectClick: (id: number) => void
}

function formatCurrency(hours: number, rate = 150): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(hours * rate)
}

export function ProjectFinancialTable({
  projects,
  onProjectClick,
}: ProjectFinancialTableProps) {
  // Summary stats
  const totalBudget = projects.reduce((sum, p) => sum + p.budgetHours, 0)
  const totalActual = projects.reduce((sum, p) => sum + p.actualHours, 0)
  const overBudgetCount = projects.filter(
    (p) => p.budgetHours > 0 && p.actualHours > p.budgetHours
  ).length
  const overallPercent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Budget</p>
          <p className="text-xl font-bold text-white">
            {Math.round(totalBudget).toLocaleString()}h
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(totalBudget)} est. revenue
          </p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Actual</p>
          <p className="text-xl font-bold text-white">
            {Math.round(totalActual).toLocaleString()}h
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(totalActual)} billed
          </p>
        </div>        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Budget Utilization</p>
          <p
            className={`text-xl font-bold ${
              overallPercent > 100
                ? 'text-red-400'
                : overallPercent > 80
                ? 'text-yellow-400'
                : 'text-green-400'
            }`}
          >
            {Math.round(overallPercent)}%
          </p>
          <div className="flex items-center gap-1 mt-1">
            {overallPercent > 100 ? (
              <TrendingUp size={12} className="text-red-400" />
            ) : (
              <TrendingDown size={12} className="text-green-400" />
            )}
            <span className="text-xs text-gray-500">
              {overallPercent > 100 ? 'Over budget' : 'Under budget'}
            </span>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Over Budget</p>
          <p
            className={`text-xl font-bold ${
              overBudgetCount > 0 ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {overBudgetCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            of {projects.length} projects
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Budget
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Actual
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billing
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {projects.map((project) => {
                const pct =
                  project.budgetHours > 0
                    ? (project.actualHours / project.budgetHours) * 100
                    : 0
                const isOver = pct > 100

                return (
                  <tr
                    key={project.id}
                    onClick={() => onProjectClick(project.id)}
                    className="hover:bg-gray-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isOver && (
                          <AlertTriangle
                            size={14}
                            className="text-red-400 flex-shrink-0"
                          />
                        )}
                        <span className="text-white font-medium truncate max-w-[240px]">
                          {project.name}
                        </span>
                      </div>
                    </td>                    <td className="px-4 py-3 text-gray-400 truncate max-w-[160px]">
                      {project.company}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono">
                      {Math.round(project.budgetHours)}h
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${
                        isOver ? 'text-red-400' : 'text-gray-300'
                      }`}
                    >
                      {Math.round(project.actualHours)}h
                    </td>
                    <td className="px-4 py-3 w-[140px]">
                      <BudgetGauge
                        budgetHours={project.budgetHours}
                        actualHours={project.actualHours}
                        compact
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {project.billingMethod || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">
                        {project.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-800/50">
          {projects.map((project) => {
            const pct =
              project.budgetHours > 0
                ? (project.actualHours / project.budgetHours) * 100
                : 0
            const isOver = pct > 100

            return (
              <button
                key={project.id}
                onClick={() => onProjectClick(project.id)}
                className="w-full text-left p-4 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {isOver && (
                      <AlertTriangle
                        size={14}
                        className="text-red-400 flex-shrink-0"
                      />
                    )}
                    <span className="text-sm font-medium text-white truncate">
                      {project.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {project.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{project.company}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>
                    Budget: {Math.round(project.budgetHours)}h → Actual:{' '}
                    {Math.round(project.actualHours)}h
                  </span>
                  <span
                    className={isOver ? 'text-red-400 font-medium' : ''}
                  >
                    {Math.round(pct)}%
                  </span>
                </div>
                <BudgetGauge
                  budgetHours={project.budgetHours}
                  actualHours={project.actualHours}
                  compact
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}