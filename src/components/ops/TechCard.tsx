'use client'

import { memo } from 'react'
import type { FleetTech } from '@/types/ops'

interface TechCardProps {
  tech: FleetTech
  onClick: () => void
  isSelected?: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function PriorityPill({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    'Priority 1 - Critical': 'bg-red-500/10 text-red-400 border-red-500/20',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Priority 2 - High': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Low: 'bg-green-500/10 text-green-400 border-green-500/20',
  }
  const cls = colors[priority] ?? 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>
      {priority}
    </span>
  )
}

export const TechCard = memo(function TechCard({ tech, onClick, isSelected }: TechCardProps) {
  const avatarColor = tech.hosColor === 'red'
    ? 'bg-red-500/20 border-red-500/40'
    : tech.hosColor === 'yellow'
    ? 'bg-yellow-500/20 border-yellow-500/40'
    : 'bg-blue-500/20 border-blue-500/40'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg p-3 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-gray-100 dark:bg-gray-800 border border-blue-500/30'
          : 'bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border flex-shrink-0 ${avatarColor}`}>
          <span className="text-gray-900 dark:text-white">{getInitials(tech.name)}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tech.name}</p>
            <span className={`text-xs font-medium ${tech.speed > 0 ? 'text-green-400' : 'text-gray-500'}`}>
              {tech.speed > 0 ? `${tech.speed} mph` : 'Parked'}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{tech.truckName}</p>

          {/* Pills */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {tech.currentTicket && (
              <PriorityPill priority={tech.currentTicket.priority} />
            )}
            {tech.hosColor === 'red' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                Low HOS
              </span>
            )}
            {tech.hosColor === 'yellow' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                HOS Warning
              </span>
            )}
            {tech.scheduledHold.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
                Holds: {tech.scheduledHold.length}
              </span>
            )}
          </div>

          {/* Dispatch preview */}
          {tech.dispatch.length > 0 && (
            <div className="mt-2 space-y-1">
              {tech.dispatch.slice(0, 2).map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    d.type === 'On-Site' ? 'bg-blue-400' :
                    d.type === 'Remote' ? 'bg-green-400' :
                    d.type === 'Meeting' ? 'bg-purple-400' :
                    'bg-gray-400'
                  }`} />
                  <span className="truncate">{d.start}–{d.end}</span>
                  <span className="truncate text-gray-500">{d.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  )
})
