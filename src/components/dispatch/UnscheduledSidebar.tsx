'use client'

// ============================================================
// UnscheduledSidebar — RX Skin Dispatch Board
// Left sidebar listing tickets without schedule entries.
// Each ticket card is draggable via FullCalendar external events.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2, Ticket as TicketIcon } from 'lucide-react'
import type { Ticket } from '@/types'
import { Draggable } from '@fullcalendar/interaction'

interface UnscheduledSidebarProps {
  tickets: Ticket[]
  isLoading: boolean
  collapsed: boolean
  onToggleCollapse: () => void
}

/** Priority badge color mapping */
function getPriorityColor(priority: string): string {
  const p = priority.toLowerCase()
  if (p.includes('critical') || p.includes('emergency')) return 'bg-red-500/20 text-red-400'
  if (p.includes('high')) return 'bg-orange-500/20 text-orange-400'
  if (p.includes('medium') || p.includes('normal')) return 'bg-blue-500/20 text-blue-400'
  return 'bg-gray-500/20 text-gray-400'
}

export function UnscheduledSidebar({
  tickets,
  isLoading,
  collapsed,
  onToggleCollapse,
}: UnscheduledSidebarProps) {
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize FullCalendar Draggable on the container
  useEffect(() => {
    if (!containerRef.current || collapsed) return

    const draggable = new Draggable(containerRef.current, {
      itemSelector: '[data-dispatch-ticket]',
      eventData: (el) => {
        const ticketId = el.getAttribute('data-ticket-id')
        const summary = el.getAttribute('data-ticket-summary') ?? ''
        const company = el.getAttribute('data-ticket-company') ?? ''
        return {
          title: summary,
          duration: '01:00:00', // Default 1 hour
          extendedProps: {
            ticketId: ticketId ? parseInt(ticketId, 10) : 0,
            company,
            isExternal: true,
          },
        }
      },
    })

    return () => draggable.destroy()
  }, [collapsed, tickets])

  const filtered = search.trim()
    ? tickets.filter(
        (t) =>
          t.summary.toLowerCase().includes(search.toLowerCase()) ||
          t.company.toLowerCase().includes(search.toLowerCase()) ||
          String(t.id).includes(search)
      )
    : tickets

  // Collapsed state — just show toggle button
  if (collapsed) {
    return (
      <div className="flex-shrink-0 flex flex-col items-center pt-2">
        <button
          onClick={onToggleCollapse}
          className="rounded-md p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Show unscheduled tickets"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 w-72 border-r border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <TicketIcon className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Unscheduled</h3>
          <span className="text-xs text-gray-500 tabular-nums">({filtered.length})</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="rounded-md p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Filter tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Ticket list */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-500">
              {search ? 'No tickets match filter' : 'All tickets are scheduled'}
            </p>
          </div>
        ) : (
          filtered.map((ticket) => (
            <div
              key={ticket.id}
              data-dispatch-ticket
              data-ticket-id={ticket.id}
              data-ticket-summary={ticket.summary}
              data-ticket-company={ticket.company}
              className="rounded-lg border border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/80 p-2.5 cursor-grab active:cursor-grabbing hover:border-blue-400/50 hover:bg-blue-500/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-1.5">
                <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug">
                  {ticket.summary}
                </p>
                <span className="flex-shrink-0 text-[10px] tabular-nums text-gray-500">
                  #{ticket.id}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
                <span className="text-[10px] text-gray-500 truncate">{ticket.company}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
