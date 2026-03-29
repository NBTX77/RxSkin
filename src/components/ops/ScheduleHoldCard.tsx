'use client'

import type { ScheduleHoldTicket } from '@/types/ops'

interface ScheduleHoldCardProps {
  ticket: ScheduleHoldTicket
  onContextMenu?: (e: React.MouseEvent) => void
}

function PriorityPill({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Low: 'bg-green-500/10 text-green-400 border-green-500/20',
  }
  const cls = colors[priority] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>
      {priority}
    </span>
  )
}

export function ScheduleHoldCard({ ticket, onContextMenu }: ScheduleHoldCardProps) {
  const formattedDate = (() => {
    try {
      return new Date(ticket.dateEntered).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  })()

  return (
    <div
      onContextMenu={onContextMenu}
      className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 hover:bg-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">#{ticket.id}</span>
          <PriorityPill priority={ticket.priority} />
        </div>
        {formattedDate && (
          <span className="text-xs text-gray-500">{formattedDate}</span>
        )}
      </div>
      <p className="text-sm text-white mb-1">{ticket.summary}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{ticket.company}</span>
        <span className="text-xs text-gray-400">
          {ticket.member === 'Unassigned' ? (
            <span className="text-yellow-400">Unassigned</span>
          ) : (
            ticket.member
          )}
        </span>
      </div>
    </div>
  )
}
