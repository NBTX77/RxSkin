'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { queryKeys } from '@/lib/query-keys'
import type { Ticket, TicketFilters } from '@/types'
import { useState, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AlertCircle, RefreshCw, Search, LayoutGrid, List, Ticket as TicketIcon } from 'lucide-react'
import { TicketCard } from './TicketCard'
import Link from 'next/link'
import { getPriorityBadgeStyle, getStatusBadgeStyle, BADGE_BASE_CLASSES } from '@/lib/ui/badgeStyles'
import { TicketCardSkeleton } from '@/components/ui/TicketCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'

async function fetchTickets(filters: TicketFilters): Promise<Ticket[]> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status?.length) filters.status.forEach(s => params.append('status', s))

  const res = await fetch(`/api/tickets?${params}`)
  if (!res.ok) throw new Error('Failed to fetch tickets')
  return res.json()
}

export function TicketListClient() {
  const { data: session } = useSession()
  const [filters, setFilters] = useState<TicketFilters>({})
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const tenantId = session?.user?.tenantId ?? ''

  const { data: tickets, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.tickets.list(tenantId, filters),
    queryFn: () => fetchTickets(filters),
    enabled: !!tenantId,
    staleTime: 30 * 1000,
  })

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFilters(prev => ({ ...prev, search: search || undefined }))
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TicketCardSkeleton key={i} style={{ animationDelay: `${i * 75}ms` }} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="text-red-400 mb-3" size={32} />
        <p className="text-gray-300 font-medium">Failed to load tickets</p>
        <p className="text-gray-500 text-sm mt-1">Check your ConnectWise credentials in .env.local</p>
        <button
          onClick={() => refetch()}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    )
  }

  // Group by status for the status filter pills
  const statusCounts: Record<string, number> = {}
  tickets?.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1
  })

  return (
    <div className="space-y-4">
      {/* Search + View Toggle */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <label htmlFor="ticket-search" className="sr-only">Search tickets</label>
          <input
            id="ticket-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gray-800/80 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
          />
        </form>
        <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700/50 p-0.5">
          <button
            onClick={() => setViewMode('cards')}
            aria-label="Card view"
            className={`p-2 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            aria-label="Table view"
            className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilters(prev => ({ ...prev, status: undefined }))}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !filters.status?.length ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          All ({tickets?.length ?? 0})
        </button>
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilters(prev => ({ ...prev, status: [status] }))}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filters.status?.[0] === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {status} ({count})
          </button>
        ))}
      </div>

      {/* Card view */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {tickets?.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
          {tickets?.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={TicketIcon} title="No tickets found" description="Try adjusting your filters." />
            </div>
          )}
        </div>
      ) : (
        /* Virtualized table view */
        <VirtualizedTicketTable tickets={tickets ?? []} />
      )}
    </div>
  )
}

// ── Virtualized Table ────────────────────────────────────

const ROW_HEIGHT = 48

function VirtualizedTicketTable({ tickets }: { tickets: Ticket[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: tickets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800">
        <EmptyState icon={TicketIcon} title="No tickets found" description="Try adjusting your filters." />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Fixed header */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex text-sm">
          <div className="w-16 px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">#</div>
          <div className="flex-1 px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Summary</div>
          <div className="w-40 px-4 py-3 text-gray-500 dark:text-gray-400 font-medium hidden lg:block">Company</div>
          <div className="w-36 px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Status</div>
          <div className="w-32 px-4 py-3 text-gray-500 dark:text-gray-400 font-medium hidden xl:block">Assigned</div>
          <div className="w-24 px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Priority</div>
        </div>
      </div>

      {/* Scrollable virtualized body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight: '70vh' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const ticket = tickets[virtualRow.index]
            const priorityStyle = getPriorityBadgeStyle(ticket.priority)
            const statusStyle = getStatusBadgeStyle(ticket.status)
            return (
              <div
                key={ticket.id}
                className="absolute top-0 left-0 w-full flex items-center text-sm border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="w-16 px-4">
                  <Link href={`/tickets/${ticket.id}`} className="text-gray-500 font-mono text-xs hover:text-blue-400">
                    {ticket.id}
                  </Link>
                </div>
                <div className="flex-1 px-4 min-w-0">
                  <Link href={`/tickets/${ticket.id}`} className="text-gray-900 dark:text-gray-100 font-medium truncate block hover:text-blue-600 dark:hover:text-white">
                    {ticket.summary}
                  </Link>
                </div>
                <div className="w-40 px-4 text-gray-600 dark:text-gray-400 truncate hidden lg:block">{ticket.company}</div>
                <div className="w-36 px-4">
                  <span className={`inline-flex items-center ${BADGE_BASE_CLASSES} ${statusStyle}`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="w-32 px-4 text-gray-600 dark:text-gray-400 text-sm truncate hidden xl:block">{ticket.assignedTo ?? '—'}</div>
                <div className="w-24 px-4">
                  <span className={`inline-flex items-center ${BADGE_BASE_CLASSES} ${priorityStyle}`}>
                    {ticket.priority ?? 'None'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
