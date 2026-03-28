'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus } from 'lucide-react'
import Link from 'next/link'

interface Ticket {
  id: number
  summary: string
  status: string
  priority: string
  company: string
  assignedTo?: string
  updatedAt: string
}

/* ── unified badge helper (shared pattern) ── */
function badgeClasses(variant: 'priority' | 'status', value: string) {
  const v = value.toLowerCase()
  const base = 'inline-block px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap'
  if (variant === 'priority') {
    if (v === 'critical') return `${base} bg-red-500/10 text-red-400 border-red-500/30`
    if (v === 'high') return `${base} bg-orange-500/10 text-orange-400 border-orange-500/30`
    if (v === 'medium') return `${base} bg-yellow-500/10 text-yellow-400 border-yellow-500/30`
    return `${base} bg-green-500/10 text-green-400 border-green-500/30`
  }
  // status
  if (v === 'resolved' || v === 'closed') return `${base} bg-green-500/10 text-green-400 border-green-500/30`
  if (v === 'in progress') return `${base} bg-blue-500/10 text-blue-400 border-blue-500/30`
  if (v.includes('waiting')) return `${base} bg-yellow-500/10 text-yellow-400 border-yellow-500/30`
  if (v === 'scheduled' || v === 'schedule hold') return `${base} bg-purple-500/10 text-purple-400 border-purple-500/30`
  return `${base} bg-gray-500/10 text-gray-300 border-gray-500/30`
}

export default function TicketsPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
  })

  const { data: tickets = [], isLoading, error } = useQuery<Ticket[]>({
    queryKey: ['tickets', filters, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        status: filters.status,
        priority: filters.priority,
      })
      const res = await fetch(`/api/tickets?${params}`)
      if (!res.ok) throw new Error('Failed to fetch tickets')
      const json = await res.json()
      return json.data ?? json
    },
  })

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">Tickets</h1>
            <Link
              href="/tickets/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              New Ticket
            </Link>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {isLoading && <div className="text-gray-400">Loading tickets...</div>}
        {error && <div className="text-red-400">Error loading tickets</div>}

        {tickets.length === 0 && !isLoading ? (
          <div className="text-center text-gray-400">No tickets found</div>
        ) : (
          /* Desktop table */
          <div className="hidden lg:block bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: '80px' }} />
                <col />
                <col style={{ width: '160px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '150px' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Ticket #</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Summary</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 align-middle">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                      >
                        #{ticket.id}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 align-middle text-white text-sm truncate">{ticket.summary}</td>
                    <td className="px-4 py-2.5 align-middle text-gray-400 text-sm truncate">{ticket.company}</td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className={badgeClasses('status', ticket.status)}>{ticket.status}</span>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className={badgeClasses('priority', ticket.priority)}>{ticket.priority}</span>
                    </td>
                    <td className="px-4 py-2.5 align-middle text-gray-400 text-sm whitespace-nowrap">
                      {new Date(ticket.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile card view */}
        {!isLoading && tickets.length > 0 && (
          <div className="lg:hidden space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block p-4 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-semibold">#{ticket.id}</span>
                    <span className={badgeClasses('priority', ticket.priority)}>{ticket.priority}</span>
                  </div>
                  <span className={badgeClasses('status', ticket.status)}>{ticket.status}</span>
                </div>
                <p className="text-white font-medium mb-2">{ticket.summary}</p>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{ticket.company}</span>
                  <span>{new Date(ticket.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
