'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, Filter, X } from 'lucide-react'
import Link from 'next/link'

interface Ticket {
  id: number
  summary: string
  status: string
  priority: string
  board: string
  company: string
  assignedTo?: string
  updatedAt: string
}

interface FilterOptions {
  boards: string[]
  companies: string[]
  priorities: string[]
  statuses: string[]
  assignees: string[]
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

const defaultFilters = {
  status: 'all',
  priority: 'all',
  board: 'all',
  company: 'all',
  assignedTo: 'all',
}

const selectClasses =
  'px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0'

export default function TicketsPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)

  // Count active filters (excluding 'all')
  const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length

  // Fetch filter options from distinct ticket values
  const { data: filterOpts } = useQuery<FilterOptions>({
    queryKey: ['ticket-filters'],
    queryFn: async () => {
      const res = await fetch('/api/tickets/filters')
      if (!res.ok) throw new Error('Failed to fetch filters')
      return res.json()
    },
    staleTime: 60_000, // cache 1 min
  })

  const { data: tickets = [], isLoading, error } = useQuery<Ticket[]>({
    queryKey: ['tickets', filters, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== 'all') params.set(k, v)
      })
      const res = await fetch(`/api/tickets?${params}`)
      if (!res.ok) throw new Error('Failed to fetch tickets')
      const json = await res.json()
      return json.data ?? json
    },
  })

  function clearFilters() {
    setFilters(defaultFilters)
    setSearch('')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">Tickets</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Filter size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <Link
                href="/tickets/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                New Ticket
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Filter bar */}
          {showFilters && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={filters.board}
                onChange={(e) => setFilters({ ...filters, board: e.target.value })}
                className={selectClasses}
              >
                <option value="all">All Boards</option>
                {filterOpts?.boards.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                className={selectClasses}
              >
                <option value="all">All Companies</option>
                {filterOpts?.companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className={selectClasses}
              >
                <option value="all">All Status</option>
                {filterOpts?.statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className={selectClasses}
              >
                <option value="all">All Priority</option>
                {filterOpts?.priorities.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select
                value={filters.assignedTo}
                onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                className={selectClasses}
              >
                <option value="all">All Assignees</option>
                {filterOpts?.assignees.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors"
                >
                  <X size={13} />
                  Clear All
                </button>
              )}
            </div>
          )}

          {/* Active filter pills (shown when filter bar is collapsed) */}
          {!showFilters && activeFilterCount > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {filters.board !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Board: {filters.board}
                  <button onClick={() => setFilters({ ...filters, board: 'all' })} className="hover:text-white"><X size={11} /></button>
                </span>
              )}
              {filters.company !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Company: {filters.company}
                  <button onClick={() => setFilters({ ...filters, company: 'all' })} className="hover:text-white"><X size={11} /></button>
                </span>
              )}
              {filters.status !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Status: {filters.status}
                  <button onClick={() => setFilters({ ...filters, status: 'all' })} className="hover:text-white"><X size={11} /></button>
                </span>
              )}
              {filters.priority !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Priority: {filters.priority}
                  <button onClick={() => setFilters({ ...filters, priority: 'all' })} className="hover:text-white"><X size={11} /></button>
                </span>
              )}
              {filters.assignedTo !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Assignee: {filters.assignedTo}
                  <button onClick={() => setFilters({ ...filters, assignedTo: 'all' })} className="hover:text-white"><X size={11} /></button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-300 ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {isLoading && <div className="text-gray-400">Loading tickets...</div>}
        {error && <div className="text-red-400">Error loading tickets</div>}

        {/* Result count */}
        {!isLoading && tickets.length > 0 && (
          <div className="text-xs text-gray-500 mb-2">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            {activeFilterCount > 0 ? ' (filtered)' : ''}
          </div>
        )}

        {tickets.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-sm">
              {activeFilterCount > 0 || search
                ? 'No tickets match your filters'
                : 'No tickets found'}
            </div>
            {(activeFilterCount > 0 || search) && (
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-400 text-sm hover:text-blue-300"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          /* Desktop table */
          <div className="hidden lg:block bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 w-[70px]">Ticket</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300">Summary</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 w-[120px]">Board</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 w-[140px]">Company</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 w-[130px]">Assignee</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 w-[120px]">Status</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 w-[100px]">Priority</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 w-[130px]">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-3 py-2.5 align-middle">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                      >
                        #{ticket.id}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-white text-sm">
                      <div className="truncate">{ticket.summary}</div>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-gray-400 text-sm">
                      <div className="truncate">{ticket.board}</div>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-gray-400 text-sm">
                      <div className="truncate">{ticket.company}</div>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-gray-400 text-sm">
                      <div className="truncate">{ticket.assignedTo || '—'}</div>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <span className={badgeClasses('status', ticket.status)}>{ticket.status}</span>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <span className={badgeClasses('priority', ticket.priority)}>{ticket.priority}</span>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-gray-400 text-sm whitespace-nowrap">
                      {(!ticket.updatedAt ? '\u2014' : new Date(ticket.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}
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
                <p className="text-white font-medium mb-1">{ticket.summary}</p>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span className="truncate mr-2">{ticket.company}</span>
                  <span className="whitespace-nowrap">{(!ticket.updatedAt ? '\u2014' : new Date(ticket.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</span>
                </div>
                {(ticket.board || ticket.assignedTo) && (
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    {ticket.board && <span>{ticket.board}</span>}
                    {ticket.assignedTo && <span>{ticket.assignedTo}</span>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
