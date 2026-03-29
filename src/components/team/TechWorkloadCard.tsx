'use client'

import { useState } from 'react'
import { ChevronDown, Clock, Ticket, Smile } from 'lucide-react'
import type { TechWorkload } from '@/types/team'
import type { DepartmentCode } from '@/types'

const DEPT_COLORS: Record<DepartmentCode, { bg: string; text: string; badge: string }> = {
  IT: {
    bg: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  SI: {
    bg: 'bg-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  },
  AM: {
    bg: 'bg-green-500',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  },
  GA: {
    bg: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  },
  LT: {
    bg: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  },
}

function getCSATColor(csatPercent: number): string {
  if (csatPercent >= 90) return 'text-emerald-500'
  if (csatPercent >= 70) return 'text-yellow-500'
  return 'text-red-500'
}

function getCapacityColor(utilization: number): string {
  if (utilization > 100) return 'bg-red-500'
  if (utilization > 75) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getCapacityBgColor(utilization: number): string {
  if (utilization > 100) return 'bg-red-100 dark:bg-red-950/50'
  if (utilization > 75) return 'bg-yellow-100 dark:bg-yellow-950/50'
  return 'bg-green-100 dark:bg-green-950/50'
}

function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface TechWorkloadCardProps {
  tech: TechWorkload
}

export function TechWorkloadCard({ tech }: TechWorkloadCardProps) {
  const [expanded, setExpanded] = useState(false)
  const deptColor = DEPT_COLORS[tech.department]
  const capacityBarColor = getCapacityColor(tech.utilization)
  const capacityBg = getCapacityBgColor(tech.utilization)
  const barWidth = Math.min(tech.utilization, 120) // cap visual at 120%

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full ${deptColor.bg} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-sm font-bold">{getInitials(tech.name)}</span>
          </div>

          {/* Name + dept */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tech.name}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${deptColor.badge}`}>
                {tech.department}
              </span>
            </div>
            {/* Hours + entries count + CSAT */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {tech.scheduledHours} / {tech.capacity} hrs
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-600">
                {tech.entries.length} {tech.entries.length === 1 ? 'entry' : 'entries'}
              </span>
              {tech.csatPercent != null && tech.csatReviews != null && tech.csatReviews > 0 ? (
                <span className="flex items-center gap-1 ml-auto">
                  <Smile size={12} className={getCSATColor(tech.csatPercent)} />
                  <span className={`text-xs font-semibold ${getCSATColor(tech.csatPercent)}`}>
                    {tech.csatPercent}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    ({tech.csatReviews})
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1 ml-auto">
                  <Smile size={12} className="text-gray-400 dark:text-gray-600" />
                  <span className="text-xs text-gray-400 dark:text-gray-600">&mdash;</span>
                </span>
              )}</div>
          </div>

          {/* Expand indicator */}
          <ChevronDown
            size={16}
            className={`text-gray-400 dark:text-gray-600 transition-transform duration-200 flex-shrink-0 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Capacity bar */}
        <div className="mt-3">
          <div className={`h-2 rounded-full ${capacityBg} overflow-hidden`}>
            <div
              className={`h-full rounded-full ${capacityBarColor} transition-all duration-300`}
              style={{ width: `${Math.min(barWidth, 100)}%` }}
            />
          </div>
          {tech.utilization > 100 && (
            <p className="text-[10px] font-medium text-red-500 mt-1">
              {tech.utilization}% -- overbooked by {tech.scheduledHours - tech.capacity} hrs
            </p>
          )}
        </div>
      </button>

      {/* Expanded schedule detail */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4">
          {tech.entries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-500 py-3">No schedule entries</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {tech.entries.map(entry => (
                <div key={entry.id} className="py-3 flex items-start gap-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 flex-shrink-0 w-28">
                    <Clock size={12} />
                    <span>{formatTime(entry.start)} - {formatTime(entry.end)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry.ticketId ? (
                      <a
                        href={`/tickets/${entry.ticketId}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        onClick={e => e.stopPropagation()}
                      >
                        <Ticket size={12} />
                        <span className="truncate">#{entry.ticketId} {entry.ticketSummary ?? ''}</span>
                      </a>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {entry.type || 'Scheduled'}
                      </p>
                    )}
                    {entry.companyName && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5">
                        {entry.companyName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
