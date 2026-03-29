'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { queryKeys } from '@/lib/query-keys'
import type { Ticket, TicketFilters } from '@/types'
import { useState } from 'react'
import { AlertCircle, RefreshCw, Search, LayoutGrid, List } from 'lucide-react'
import { TicketCard } from './TicketCard'
import Link from 'next/link'

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-500',
}

const STATUS_COLORS: Record<string, string> = {
  'New': 'text-blue-400 bg-blue-950 border-blue-800',
  'In Progress': 'text-yellow-400 bg-yellow-950 border-yellow-800',
  'Waiting on Client': 'text-purple-400 bg-purple-950 border-purple-800',
  'Scheduled': 'text-cyan-400 bg-cyan-950 border-cyan-800',
  'Resolved': 'text-green-400 bg-green-950 border-green-800',
  'Closed': 'text-gray-400 bg-gray-800 border-gray-700',
}

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
          <div key={i} className="h-24 rounded-xl bg-gray-800/50 animate-pulse" />
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
            <div className="col-span-full text-center text-gray-500 py-12">No tickets found</div>
          )}
        </div>
      ) : (
        /* Table view */
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="text-left px-4 py-3 text-gray-400 font-medium w-16">#</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Summary</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">Company</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium hidden xl:table-cell">Assigned</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium w-8">P</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tickets?.map((ticket) => {
                const priorityColor = PRIORITY_COLORS[ticket.priority] ?? 'bg-gray-500'
                const statusColor = STATUS_COLORS[ticket.status] ?? 'text-gray-400 bg-gray-800 border-gray-700'
                return (
                  <tr key={ticket.id} className="hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/tickets/${ticket.id}`} className="text-gray-500 font-mono text-xs hover:text-blue-400">
                        {ticket.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/tickets/${ticket.id}`} className="text-gray-100 font-medium line-clamp-1 hover:text-white">
                        {ticket.summary}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{ticket.company}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusColor}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden xl:table-cell text-sm">{ticket.assignedTo ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${priorityColor}`} role="img" aria-label={`Priority: ${ticket.priority}`} />
                    </td>
                  </tr>
                )
              })}
              {tickets?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No tickets found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
