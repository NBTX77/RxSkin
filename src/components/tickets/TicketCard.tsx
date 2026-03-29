'use client'

import { memo } from 'react'
import type { Ticket } from '@/types'
import { Clock, User, Building2, MessageSquare, Smile, Meh, Frown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { PRIORITY_BORDER_COLORS, PRIORITY_DOT_COLORS, getStatusBadgeStyle, BADGE_BASE_CLASSES } from '@/lib/ui/badgeStyles'

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return ''
  }
}

interface TicketCardProps {
  ticket: Ticket
  compact?: boolean
  survey?: { rating: 'Positive' | 'Neutral' | 'Negative' } | null
}

const PRIORITY_HOVER_SHADOW: Record<string, string> = {
  Critical: 'hover:shadow-red-500/10',
  High: 'hover:shadow-orange-500/10',
}

function SurveyRatingIcon({ rating }: { rating: 'Positive' | 'Neutral' | 'Negative' }) {
  switch (rating) {
    case 'Positive':
      return <span title="Customer rated: Positive"><Smile size={14} className="text-emerald-500" /></span>
    case 'Neutral':
      return <span title="Customer rated: Neutral"><Meh size={14} className="text-yellow-500" /></span>
    case 'Negative':
      return <span title="Customer rated: Negative"><Frown size={14} className="text-red-500" /></span>
  }
}

export const TicketCard = memo(function TicketCard({ ticket, compact = false, survey }: TicketCardProps) {
  const borderColor = PRIORITY_BORDER_COLORS[ticket.priority] ?? 'border-l-gray-600'
  const statusStyle = getStatusBadgeStyle(ticket.status)
  const dotColor = PRIORITY_DOT_COLORS[ticket.priority] ?? 'bg-gray-500'
  const hoverShadow = PRIORITY_HOVER_SHADOW[ticket.priority] ?? ''

  if (compact) {
    return (
      <Link
        href={`/tickets/${ticket.id}`}
        className={`block rounded-lg border-l-[3px] ${borderColor} bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md transition-all duration-150 p-3 cursor-pointer ${hoverShadow}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-gray-800 dark:text-gray-100 font-medium truncate flex-1">{ticket.summary}</p>
          <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
          <span>{ticket.company}</span>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <span>{timeAgo(ticket.updatedAt)}</span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className={`block rounded-lg border-l-[3px] ${borderColor} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-lg transition-all duration-150 p-4 cursor-pointer group ${hoverShadow}`}
      data-feedback-component="TicketCard"
    >
      {/* Header: ID + Priority */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500">#{ticket.id}</span>
            <span className={`inline-flex items-center ${BADGE_BASE_CLASSES} ${statusStyle}`}>
              {ticket.status}
            </span>
            {survey && <SurveyRatingIcon rating={survey.rating} />}
          </div>
          <p className="text-[15px] text-gray-800 dark:text-gray-100 font-medium leading-snug line-clamp-2 group-hover:text-gray-900 dark:text-white transition-colors">
            {ticket.summary}
          </p>
        </div>
        <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${dotColor}`} role="img" aria-label={`Priority: ${ticket.priority}`} />
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Building2 size={12} className="text-gray-600" />
          {ticket.company}
        </span>
        {ticket.contact && (
          <span className="flex items-center gap-1">
            <MessageSquare size={12} className="text-gray-600" />
            {ticket.contact}
          </span>
        )}
        {ticket.assignedTo && (
          <span className="flex items-center gap-1">
            <User size={12} className="text-gray-600" />
            {ticket.assignedTo}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={12} className="text-gray-600" />
          {timeAgo(ticket.updatedAt)}
        </span>
      </div>

      {/* SLA / Hours bar */}
      {ticket.budgetHours && ticket.budgetHours > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
            <span>{ticket.actualHours ?? 0}h / {ticket.budgetHours}h</span>
            <span>{Math.round(((ticket.actualHours ?? 0) / ticket.budgetHours) * 100)}%</span>
          </div>
          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (ticket.actualHours ?? 0) / ticket.budgetHours > 0.9
                  ? 'bg-red-500'
                  : (ticket.actualHours ?? 0) / ticket.budgetHours > 0.7
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(((ticket.actualHours ?? 0) / ticket.budgetHours) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  )
})
