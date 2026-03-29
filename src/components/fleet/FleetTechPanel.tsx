'use client'

import { X, MapPin, Calendar, Ticket, Navigation, ExternalLink } from 'lucide-react'
import type { FleetTech } from '@/types/ops'

interface FleetTechPanelProps {
  tech: FleetTech
  showTrail: boolean
  onToggleTrail: (show: boolean) => void
  onClose: () => void
}

function hosSegmentColor(hosColor: FleetTech['hosColor']): string {
  switch (hosColor) {
    case 'green': return 'bg-green-500'
    case 'yellow': return 'bg-yellow-500'
    case 'red': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

export function FleetTechPanel({ tech, showTrail, onToggleTrail, onClose }: FleetTechPanelProps) {
  return (
    <div className="absolute top-3 right-3 z-[1000] w-72 sm:w-80 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700/50 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-3 pb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {tech.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-600 dark:text-gray-400">{tech.truckName}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {tech.memberIdentifier}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* HOS breakdown */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">HOS Remaining</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">{tech.hosRemaining}</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full rounded-full ${hosSegmentColor(tech.hosColor)} transition-all`}
            style={{ width: `${Math.min(100, Math.max(0, tech.hosPct))}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-500">{tech.hosPct}% available</span>
          <span className="text-[10px] text-gray-500">
            {tech.speed > 0 ? `${Math.round(tech.speed)} mph` : 'Stationary'}
          </span>
        </div>
      </div>

      {/* Location */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center gap-1.5 mb-1">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Location</span>
        </div>
        <p className="text-xs text-gray-500">
          {tech.lat.toFixed(4)}, {tech.lng.toFixed(4)}
          {tech.heading !== undefined && (
            <span className="ml-1">
              <Navigation className="inline h-3 w-3" style={{ transform: `rotate(${tech.heading}deg)` }} />
              {Math.round(tech.heading)}°
            </span>
          )}
        </p>
      </div>

      {/* Current ticket */}
      {tech.currentTicket && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Ticket className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Active Ticket</span>
          </div>
          <a
            href={`/tickets/${tech.currentTicket.id}`}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            #{tech.currentTicket.id} {tech.currentTicket.summary}
          </a>
          {tech.currentTicket.company && (
            <p className="text-[10px] text-gray-500 mt-0.5">{tech.currentTicket.company}</p>
          )}
        </div>
      )}

      {/* Today's schedule */}
      {tech.dispatch.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Today&apos;s Schedule ({tech.dispatch.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {tech.dispatch.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2 py-1 px-2 rounded bg-gray-50 dark:bg-gray-800/80 text-xs"
              >
                <span className="text-gray-500 shrink-0 tabular-nums">
                  {entry.start}–{entry.end}
                </span>
                <span className="text-gray-900 dark:text-white truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GPS trail toggle */}
      <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700/50">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showTrail}
            onChange={(e) => onToggleTrail(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-700 dark:text-gray-300">Show GPS trail (last 30 min)</span>
        </label>
      </div>

      {/* Quick links */}
      <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700/50 flex gap-2">
        <a
          href={`/schedule?member=${tech.memberIdentifier}`}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Calendar className="h-3 w-3" />
          Schedule
        </a>
        <a
          href={`/tickets?assignee=${tech.memberIdentifier}`}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Tickets
        </a>
      </div>
    </div>
  )
}
