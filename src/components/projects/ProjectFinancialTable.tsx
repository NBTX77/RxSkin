'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { Project } from '@/types'
import { BudgetGauge } from './BudgetGauge'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
} from 'lucide-react'

interface ProjectFinancialTableProps {
  projects: Project[]
  onProjectClick: (id: number) => void
}

// --- Types ---

type SortDirection = 'asc' | 'desc'

type ColumnKey =
  | 'project'
  | 'company'
  | 'budget'
  | 'actual'
  | 'utilization'
  | 'billing'
  | 'status'

type TextFilter = { type: 'text'; values: Set<string> }
type NumericFilter = { type: 'numeric'; min: number; max: number }
type FilterValue = TextFilter | NumericFilter

interface ColumnDef {
  key: ColumnKey
  label: string
  align: 'left' | 'right'
  filterType: 'text' | 'numeric'
  defaultWidth: number
  minWidth: number
}

const COLUMNS: ColumnDef[] = [
  { key: 'project', label: 'Project', align: 'left', filterType: 'text', defaultWidth: 240, minWidth: 120 },
  { key: 'company', label: 'Company', align: 'left', filterType: 'text', defaultWidth: 160, minWidth: 100 },
  { key: 'budget', label: 'Budget', align: 'right', filterType: 'numeric', defaultWidth: 80, minWidth: 60 },
  { key: 'actual', label: 'Actual', align: 'right', filterType: 'numeric', defaultWidth: 80, minWidth: 60 },
  { key: 'utilization', label: 'Utilization', align: 'left', filterType: 'numeric', defaultWidth: 140, minWidth: 60 },
  { key: 'billing', label: 'Billing', align: 'left', filterType: 'text', defaultWidth: 100, minWidth: 60 },
  { key: 'status', label: 'Status', align: 'left', filterType: 'text', defaultWidth: 120, minWidth: 60 },
]

// --- Helpers ---

function formatCurrency(hours: number, rate = 150): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(hours * rate)
}

function getProjectValue(project: Project, key: ColumnKey): string | number {
  switch (key) {
    case 'project':
      return project.name
    case 'company':
      return project.company
    case 'budget':
      return project.budgetHours
    case 'actual':
      return project.actualHours
    case 'utilization':
      return project.budgetHours > 0
        ? (project.actualHours / project.budgetHours) * 100
        : 0
    case 'billing':
      return project.billingMethod || ''
    case 'status':
      return project.status
    default:
      return ''
  }
}

function getProjectStringValue(project: Project, key: ColumnKey): string {
  const val = getProjectValue(project, key)
  return typeof val === 'number' ? String(Math.round(val)) : val
}

// --- Filter Dropdown Components ---

function TextFilterDropdown({
  columnKey,
  projects,
  activeFilter,
  onApply,
  onClear,
}: {
  columnKey: ColumnKey
  projects: Project[]
  activeFilter: TextFilter | undefined
  onApply: (values: Set<string>) => void
  onClear: () => void
}) {
  const uniqueValues = useMemo(() => {
    const vals = new Set<string>()
    projects.forEach((p) => {
      const v = getProjectStringValue(p, columnKey)
      if (v) vals.add(v)
    })
    return Array.from(vals).sort()
  }, [projects, columnKey])

  const [selected, setSelected] = useState<Set<string>>(
    () => activeFilter?.values ?? new Set(uniqueValues)
  )

  const toggleValue = (val: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(val)) {
        next.delete(val)
      } else {
        next.add(val)
      }
      return next
    })
  }

  const selectAll = () => setSelected(new Set(uniqueValues))
  const selectNone = () => setSelected(new Set())

  return (
    <div className="p-2 space-y-2 min-w-[180px]">
      <div className="flex items-center justify-between text-xs">
        <button
          onClick={selectAll}
          className="text-blue-500 hover:text-blue-400"
        >
          All
        </button>
        <button
          onClick={selectNone}
          className="text-blue-500 hover:text-blue-400"
        >
          None
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {uniqueValues.map((val) => (
          <label
            key={val}
            className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 px-1 py-0.5 rounded"
          >
            <input
              type="checkbox"
              checked={selected.has(val)}
              onChange={() => toggleValue(val)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 h-3 w-3"
            />
            <span className="truncate">{val || '(empty)'}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-700/50">
        <button
          onClick={() => onApply(selected)}
          className="flex-1 text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-500"
        >
          Apply
        </button>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

function NumericFilterDropdown({
  columnKey,
  projects,
  activeFilter,
  onApply,
  onClear,
}: {
  columnKey: ColumnKey
  projects: Project[]
  activeFilter: NumericFilter | undefined
  onApply: (min: number, max: number) => void
  onClear: () => void
}) {
  const { globalMin, globalMax } = useMemo(() => {
    let gMin = Infinity
    let gMax = -Infinity
    projects.forEach((p) => {
      const v = getProjectValue(p, columnKey) as number
      if (v < gMin) gMin = v
      if (v > gMax) gMax = v
    })
    if (!isFinite(gMin)) gMin = 0
    if (!isFinite(gMax)) gMax = 0
    return { globalMin: Math.floor(gMin), globalMax: Math.ceil(gMax) }
  }, [projects, columnKey])

  const [min, setMin] = useState<string>(
    activeFilter ? String(activeFilter.min) : String(globalMin)
  )
  const [max, setMax] = useState<string>(
    activeFilter ? String(activeFilter.max) : String(globalMax)
  )

  return (
    <div className="p-2 space-y-2 min-w-[180px]">
      <p className="text-xs text-gray-500 font-medium">Range</p>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-gray-500">Min</label>
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 rounded px-2 py-1 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gray-500">Max</label>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 rounded px-2 py-1 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <p className="text-[10px] text-gray-500">
        Data range: {globalMin} &ndash; {globalMax}
      </p>
      <div className="flex items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-700/50">
        <button
          onClick={() =>
            onApply(
              parseFloat(min) || globalMin,
              parseFloat(max) || globalMax
            )
          }
          className="flex-1 text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-500"
        >
          Apply
        </button>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

// --- Main Component ---

export function ProjectFinancialTable({
  projects,
  onProjectClick,
}: ProjectFinancialTableProps) {
  // --- Sort state ---
  const [sortColumn, setSortColumn] = useState<ColumnKey>('project')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // --- Filter state ---
  const [filters, setFilters] = useState<Record<string, FilterValue>>({})
  const [openFilterKey, setOpenFilterKey] = useState<ColumnKey | null>(null)
  const filterDropdownRef = useRef<HTMLDivElement>(null)

  // --- Column widths state ---
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(
    () => {
      const widths: Record<string, number> = {}
      COLUMNS.forEach((c) => {
        widths[c.key] = c.defaultWidth
      })
      return widths as Record<ColumnKey, number>
    }
  )

  // --- Resize drag state ---
  const resizingRef = useRef<{
    column: ColumnKey
    startX: number
    startWidth: number
    minWidth: number
  } | null>(null)

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, col: ColumnDef) => {
      e.preventDefault()
      e.stopPropagation()
      resizingRef.current = {
        column: col.key,
        startX: e.clientX,
        startWidth: columnWidths[col.key],
        minWidth: col.minWidth,
      }
    },
    [columnWidths]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return
      const { column, startX, startWidth, minWidth } = resizingRef.current
      const diff = e.clientX - startX
      const newWidth = Math.max(minWidth, startWidth + diff)
      setColumnWidths((prev) => ({ ...prev, [column]: newWidth }))
    }

    const handleMouseUp = () => {
      resizingRef.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!openFilterKey) return
    const handleClick = (e: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target as Node)
      ) {
        setOpenFilterKey(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openFilterKey])

  // --- Filter logic ---
  const hasActiveFilters = Object.keys(filters).length > 0

  const setTextFilter = (key: ColumnKey, values: Set<string>) => {
    setFilters((prev) => ({
      ...prev,
      [key]: { type: 'text' as const, values },
    }))
    setOpenFilterKey(null)
  }

  const setNumericFilter = (key: ColumnKey, min: number, max: number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: { type: 'numeric' as const, min, max },
    }))
    setOpenFilterKey(null)
  }

  const clearFilter = (key: ColumnKey) => {
    setFilters((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setOpenFilterKey(null)
  }

  const clearAllFilters = () => {
    setFilters({})
    setOpenFilterKey(null)
  }

  // --- Pipeline: projects -> filtered -> sorted ---
  const filteredProjects = useMemo(() => {
    if (!hasActiveFilters) return projects

    return projects.filter((p) => {
      for (const [key, filter] of Object.entries(filters)) {
        const colKey = key as ColumnKey
        if (filter.type === 'text') {
          const val = getProjectStringValue(p, colKey)
          if (!filter.values.has(val)) return false
        } else {
          const val = getProjectValue(p, colKey) as number
          if (val < filter.min || val > filter.max) return false
        }
      }
      return true
    })
  }, [projects, filters, hasActiveFilters])

  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects]
    sorted.sort((a, b) => {
      const aVal = getProjectValue(a, sortColumn)
      const bVal = getProjectValue(b, sortColumn)

      let cmp: number
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, {
          sensitivity: 'base',
        })
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [filteredProjects, sortColumn, sortDirection])

  // --- Sort handler ---
  const handleSort = (key: ColumnKey) => {
    if (sortColumn === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(key)
      setSortDirection('asc')
    }
  }

  // --- Summary stats (reflect filtered data) ---
  const totalBudget = sortedProjects.reduce((sum, p) => sum + p.budgetHours, 0)
  const totalActual = sortedProjects.reduce(
    (sum, p) => sum + p.actualHours,
    0
  )
  const overBudgetCount = sortedProjects.filter(
    (p) => p.budgetHours > 0 && p.actualHours > p.budgetHours
  ).length
  const overallPercent =
    totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  // --- Sort icon helper ---
  const SortIcon = ({ col }: { col: ColumnKey }) => {
    if (sortColumn !== col)
      return <ArrowUpDown size={12} className="text-gray-400" />
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} className="text-blue-400" />
    ) : (
      <ArrowDown size={12} className="text-blue-400" />
    )
  }

  const totalWidth = COLUMNS.reduce(
    (sum, c) => sum + columnWidths[c.key],
    0
  )

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">
            Total Budget{hasActiveFilters ? ' (filtered)' : ''}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {Math.round(totalBudget).toLocaleString()}h
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(totalBudget)} est. revenue
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">
            Total Actual{hasActiveFilters ? ' (filtered)' : ''}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {Math.round(totalActual).toLocaleString()}h
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(totalActual)} billed
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">
            Budget Utilization{hasActiveFilters ? ' (filtered)' : ''}
          </p>
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
        <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">
            Over Budget{hasActiveFilters ? ' (filtered)' : ''}
          </p>
          <p
            className={`text-xl font-bold ${
              overBudgetCount > 0 ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {overBudgetCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            of {sortedProjects.length} projects
          </p>
        </div>
      </div>

      {/* Clear all filters bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
          <Filter size={14} className="text-blue-500" />
          <span className="text-xs text-blue-700 dark:text-blue-300">
            {Object.keys(filters).length} filter
            {Object.keys(filters).length > 1 ? 's' : ''} active &mdash;
            showing {sortedProjects.length} of {projects.length} projects
          </span>
          <button
            onClick={clearAllFilters}
            className="ml-auto flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            <X size={12} />
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table
            className="text-sm"
            style={{ tableLayout: 'fixed', width: totalWidth }}
          >
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700/50 text-left">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="relative px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider select-none group"
                    style={{ width: columnWidths[col.key] }}
                  >
                    <div
                      className={`flex items-center gap-1 ${
                        col.align === 'right' ? 'justify-end' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        <span>{col.label}</span>
                        <SortIcon col={col.key} />
                      </button>

                      {/* Filter button */}
                      <div className="relative" ref={openFilterKey === col.key ? filterDropdownRef : undefined}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenFilterKey(
                              openFilterKey === col.key ? null : col.key
                            )
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            filters[col.key]
                              ? 'text-blue-500'
                              : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                        >
                          <Filter size={10} />
                        </button>

                        {/* Filter dropdown */}
                        {openFilterKey === col.key && (
                          <div className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-lg">
                            {col.filterType === 'text' ? (
                              <TextFilterDropdown
                                columnKey={col.key}
                                projects={projects}
                                activeFilter={
                                  filters[col.key]?.type === 'text'
                                    ? (filters[col.key] as TextFilter)
                                    : undefined
                                }
                                onApply={(values) =>
                                  setTextFilter(col.key, values)
                                }
                                onClear={() => clearFilter(col.key)}
                              />
                            ) : (
                              <NumericFilterDropdown
                                columnKey={col.key}
                                projects={projects}
                                activeFilter={
                                  filters[col.key]?.type === 'numeric'
                                    ? (filters[col.key] as NumericFilter)
                                    : undefined
                                }
                                onApply={(min, max) =>
                                  setNumericFilter(col.key, min, max)
                                }
                                onClear={() => clearFilter(col.key)}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resize handle */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, col)}
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500"
                      style={{ userSelect: 'none' }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/30">
              {sortedProjects.map((project) => {
                const pct =
                  project.budgetHours > 0
                    ? (project.actualHours / project.budgetHours) * 100
                    : 0
                const isOver = pct > 100

                return (
                  <tr
                    key={project.id}
                    onClick={() => onProjectClick(project.id)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <td
                      className="px-4 py-3"
                      style={{ width: columnWidths.project }}
                    >
                      <div className="flex items-center gap-2">
                        {isOver && (
                          <AlertTriangle
                            size={14}
                            className="text-red-400 flex-shrink-0"
                          />
                        )}
                        <span className="text-gray-900 dark:text-white font-medium truncate">
                          {project.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate"
                      style={{ width: columnWidths.company }}
                    >
                      {project.company}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-mono"
                      style={{ width: columnWidths.budget }}
                    >
                      {Math.round(project.budgetHours)}h
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${
                        isOver
                          ? 'text-red-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      style={{ width: columnWidths.actual }}
                    >
                      {Math.round(project.actualHours)}h
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ width: columnWidths.utilization }}
                    >
                      <BudgetGauge
                        budgetHours={project.budgetHours}
                        actualHours={project.actualHours}
                        compact
                      />
                    </td>
                    <td
                      className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs"
                      style={{ width: columnWidths.billing }}
                    >
                      {project.billingMethod || '\u2014'}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ width: columnWidths.status }}
                    >
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {project.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards — respects sort/filters, no resize */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700/30">
          {sortedProjects.map((project) => {
            const pct =
              project.budgetHours > 0
                ? (project.actualHours / project.budgetHours) * 100
                : 0
            const isOver = pct > 100

            return (
              <button
                key={project.id}
                onClick={() => onProjectClick(project.id)}
                className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {isOver && (
                      <AlertTriangle
                        size={14}
                        className="text-red-400 flex-shrink-0"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {project.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {project.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{project.company}</p>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span>
                    Budget: {Math.round(project.budgetHours)}h &rarr; Actual:{' '}
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

        {/* Empty state */}
        {sortedProjects.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">
              {hasActiveFilters
                ? 'No projects match the current filters.'
                : 'No projects found.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-2 text-xs text-blue-500 hover:text-blue-400"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
