'use client'

import Link from 'next/link'

interface Ticket {
  id: number
  summary: string
  priority: number
  status: { name: string }
  dateEntered: string
  company: { name: string }
  owner?: { name: string }
  board?: { name: string }
}

const priorityColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-red-500/5', text: 'text-red-400', border: 'border-red-500/20' },
  2: { bg: 'bg-orange-500/5', text: 'text-orange-400', border: 'border-orange-500/20' },
  3: { bg: 'bg-yellow-500/5', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  4: { bg: 'bg-green-500/5', text: 'text-green-400', border: 'border-green-500/20' },
}

const priorityLabels: Record<number, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const priority = priorityColors[ticket.priority] || priorityColors[4]
  const priorityLabel = priorityLabels[ticket.priority] || 'Low'

  const dateEntered = new Date(ticket.dateEntered)
  const formattedDate = dateEntered.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="block p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 hover:border-gray-700 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate">
            #{ticket.id} – {ticket.summary}
          </h3>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${priority.bg} ${priority.text} ${priority.border} border whitespace-nowrap`}>
          {priorityLabel}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate">{ticket.company.name}</span>
          {ticket.owner && (
            <>
              <span>•</span>
              <span className="truncate">{ticket.owner.name}</span>
            </>
          )}
        </div>
        <span className="whitespace-nowrap ml-2">{formattedDate}</span>
      </div>
    </Link>
  )
}
