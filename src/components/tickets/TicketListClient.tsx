'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { TicketCard } from '@/components/tickets/TicketCard'
import { Skeleton } from '@/components/ui/skeleton'

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

interface TicketsResponse {
  tickets: Ticket[]
  total: number
}

const statusFilters = ['All', 'Open', 'In Progress', 'Closed', 'On Hold']
const priorityFilters = ['All', 'Critical', 'High', 'Medium', 'Low']
async function fetchTickets(search?: string, status?: string, priority?: string) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (status && status !== 'All') params.append('status', status)
  if (priority && priority !== 'All') params.append('priority', priority)

  const response = await fetch(`/api/tickets?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch tickets')
  return response.json()
}

export function TicketListClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedPriority, setSelectedPriority] = useState('All')

  const {
    data: response,
    isLoading,
    error,
  } = useQuery<TicketsResponse>({
    queryKey: ['tickets', searchTerm, selectedStatus, selectedPriority],
    queryFn: () => fetchTickets(searchTerm, selectedStatus, selectedPriority),
    staleTime: 30 * 1000,
  })

  // API returns { data: [...], pagination: {...} } — handle both shapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = response as any
  const tickets: Ticket[] = raw?.tickets ?? raw?.data ?? []

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-500" size={16} />
        <input
          type="text"
          placeholder="Search tickets..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Status filter */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Status</label>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusFilters.map(status => (
              <option key={status} value={status}>                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Priority filter */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Priority</label>
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {priorityFilters.map(priority => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-16" />            ))}
          </div>
        ) : error ? (
          <div className="text-center text-gray-400 py-8">
            <p>Unable to load tickets</p>
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-2">
            {tickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No tickets found</p>
          </div>
        )}
      </div>

      {/* Result count */}
      {!isLoading && tickets.length > 0 && (
        <div className="text-xs text-gray-500 border-t border-gray-800 pt-2">
          Showing {tickets.length} of {response?.total || 0} tickets
        </div>
      )}
    </div>
  )
}
