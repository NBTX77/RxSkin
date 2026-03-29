'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search, ArrowUpDown, ExternalLink, Eye, Edit } from 'lucide-react'
import { useScheduleHolds } from '@/hooks/useScheduleHolds'
import { OpsHeader } from './OpsHeader'
import { ScheduleHoldCard } from './ScheduleHoldCard'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'
import type { ScheduleHoldTicket, ScheduleHoldSort } from '@/types/ops'

export function ScheduleHoldList() {
  const { data: holds, isLoading, refetch, isFetching, dataUpdatedAt } = useScheduleHolds()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ScheduleHoldSort>('priority')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; ticket: ScheduleHoldTicket } | null>(null)

  const sorted = useMemo(() => {
    const priorityOrder: Record<string, number> = {
      Critical: 0,
      'Priority 1 - Critical': 0,
      High: 1,
      'Priority 2 - High': 1,
      Medium: 2,
      'Priority 3 - Medium': 2,
      Low: 3,
      'Priority 4 - Low': 3,
    }

    if (!holds) return []
    let result = [...holds]

    if (search) {
      const term = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.summary.toLowerCase().includes(term) ||
          t.company.toLowerCase().includes(term) ||
          String(t.id).includes(term) ||
          t.member.toLowerCase().includes(term)
      )
    }

    switch (sort) {
      case 'priority':
        result.sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99))
        break
      case 'dateEntered':
        result.sort((a, b) => new Date(b.dateEntered).getTime() - new Date(a.dateEntered).getTime())
        break
      case 'company':
        result.sort((a, b) => a.company.localeCompare(b.company))
        break
    }

    return result
  }, [holds, search, sort])

  const handleContextMenu = useCallback((e: React.MouseEvent, ticket: ScheduleHoldTicket) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, ticket })
  }, [])

  const contextMenuItems: ContextMenuItem[] = contextMenu
    ? [
        {
          label: 'View Details',
          icon: <Eye size={14} />,
          onClick: () => {
            window.open(`/tickets/${contextMenu.ticket.id}`, '_blank')
          },
        },
        {
          label: 'Edit Schedule',
          icon: <Edit size={14} />,
          onClick: () => {
            // Future: open edit modal
          },
        },
        {
          label: 'Open in ConnectWise',
          icon: <ExternalLink size={14} />,
          onClick: () => {
            // CW ticket URL pattern
            window.open(`https://manage.connectwise.com/ticket/${contextMenu.ticket.id}`, '_blank')
          },
        },
      ]
    : []

  const sortOptions: { value: ScheduleHoldSort; label: string }[] = [
    { value: 'priority', label: 'Priority' },
    { value: 'dateEntered', label: 'Date Entered' },
    { value: 'company', label: 'Company' },
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <OpsHeader title="Schedule Holds" subtitle="Tickets waiting to be scheduled" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-3 animate-pulse h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <OpsHeader
        title="Schedule Holds"
        subtitle={`${sorted.length} ticket${sorted.length !== 1 ? 's' : ''} waiting to be scheduled`}
        lastSync={dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* Search + Sort bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search holds..."
            className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="text-gray-500" />
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sort === opt.value
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hold cards */}
      <div className="space-y-2">
        {sorted.map((ticket) => (
          <ScheduleHoldCard
            key={ticket.id}
            ticket={ticket}
            onContextMenu={(e) => handleContextMenu(e, ticket)}
          />
        ))}
        {sorted.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            {search ? 'No holds match your search' : 'No tickets in Schedule Hold status'}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
