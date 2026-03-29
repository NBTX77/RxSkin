'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { queryKeys } from '@/lib/query-keys'
import type { Ticket, TicketFilters } from '@/types'
import { useState, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AlertCircle, RefreshCw, Search, LayoutGrid, List, Ticket as TicketIcon, GripVertical } from 'lucide-react'
import { TicketCard } from './TicketCard'
import Link from 'next/link'
import { getPriorityBadgeStyle, getStatusBadgeStyle, BADGE_BASE_CLASSES } from '@/lib/ui/badgeStyles'
import { TicketCardSkeleton } from '@/components/ui/TicketCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

async function fetchTickets(filters: TicketFilters): Promise<Ticket[]> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status?.length) filters.status.forEach(s => params.append('status', s))

  const res = await fetch(`/api/tickets?${params}`)
  if (!res.ok) throw new Error('Failed to fetch tickets')
  return res.json()
}

interface ColumnDef {
  id: string
  label: string
  width: string
  visibility?: string
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'ticket', label: '#', width: 'w-16' },
  { id: 'summary', label: 'Summary', width: 'flex-1' },
  { id: 'company', label: 'Company', width: 'w-40', visibility: 'hidden lg:block' },
  { id: 'status', label: 'Status', width: 'w-36' },
  { id: 'assignee', label: 'Assignee', width: 'w-32', visibility: 'hidden xl:block' },
  { id: 'priority', label: 'Priority', width: 'w-24' },
]

export function TicketListClient() {
  const { data: session } = useSession()
  const [filters, setFilters] = useState<TicketFilters>({})
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS)

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
        <p className="text-gray-700 dark:text-gray-300 font-medium">Failed to load tickets</p>
        <p className="text-gray-500 text-sm mt-1">Check your ConnectWise credentials in .env.local</p>
        <button
          onClick={() => refetch()}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
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
      {/* Unified toolbar: Search + View Toggle + New Ticket */}
      <div className="flex items-center gap-2 flex-wrap">
        <form onSubmit={handleSearch} className="flex-1 relative min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <label htmlFor="ticket-search" className="sr-only">Search tickets</label>
          <input
            id="ticket-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
          />
        </form>

        {/* Status filter — compact select on desktop */}
        <div className="hidden md:block">
          <select
            value={filters.status?.[0] ?? ''}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value ? [e.target.value] : undefined }))}
            className="px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All ({tickets?.length ?? 0})</option>
            {Object.entries(statusCounts).map(([status, count]) => (
              <option key={status} value={status}>{status} ({count})</option>
            ))}
          </select>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700/50 p-0.5">
          <button
            onClick={() => setViewMode('cards')}
            aria-label="Card view"
            className={`p-2 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            aria-label="Table view"
            className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <List size={16} />
          </button>
        </div>

        {/* New Ticket button */}
        <button className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
          + New Ticket
        </button>
      </div>

      {/* Mobile status filter pills */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilters(prev => ({ ...prev, status: undefined }))}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !filters.status?.length ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
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
                : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
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
        /* Virtualized table view with sortable columns */
        <VirtualizedTicketTable tickets={tickets ?? []} columns={columns} setColumns={setColumns} />
      )}
    </div>
  )
}

// ── Sortable Column Header ────────────────────────────────

function SortableColumnHeader({ column }: { column: ColumnDef }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`px-4 py-3 text-gray-500 dark:text-gray-400 font-medium ${column.width} ${column.visibility ?? ''} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-1 group">
        <span
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
        >
          <GripVertical size={12} className="text-gray-400 dark:text-gray-600 rotate-90" />
        </span>
        {column.label}
      </div>
    </div>
  )
}

// ── Cell Renderer ────────────────────────────────────

function TicketCell({ columnId, ticket }: { columnId: string; ticket: Ticket }) {
  const priorityStyle = getPriorityBadgeStyle(ticket.priority)
  const statusStyle = getStatusBadgeStyle(ticket.status)

  switch (columnId) {
    case 'ticket':
      return (
        <Link href={`/tickets/${ticket.id}`} className="text-gray-500 font-mono text-xs hover:text-blue-400">
          {ticket.id}
        </Link>
      )
    case 'summary':
      return (
        <Link href={`/tickets/${ticket.id}`} className="text-gray-900 dark:text-gray-100 font-medium truncate block hover:text-blue-600 dark:hover:text-white">
          {ticket.summary}
        </Link>
      )
    case 'company':
      return <span className="text-gray-600 dark:text-gray-400 truncate block">{ticket.company}</span>
    case 'status':
      return (
        <span className={`inline-flex items-center ${BADGE_BASE_CLASSES} ${statusStyle}`}>
          {ticket.status}
        </span>
      )
    case 'assignee':
      return <span className="text-gray-600 dark:text-gray-400 text-sm truncate block">{ticket.assignedTo ?? '—'}</span>
    case 'priority':
      return (
        <span className={`inline-flex items-center ${BADGE_BASE_CLASSES} ${priorityStyle}`}>
          {ticket.priority ?? 'None'}
        </span>
      )
    default:
      return null
  }
}

// ── Virtualized Table ────────────────────────────────────

const ROW_HEIGHT = 48

function VirtualizedTicketTable({
  tickets,
  columns,
  setColumns,
}: {
  tickets: Ticket[]
  columns: ColumnDef[]
  setColumns: React.Dispatch<React.SetStateAction<ColumnDef[]>>
}) {
  const parentRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleColumnDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setColumns(prev => {
        const oldIndex = prev.findIndex(c => c.id === active.id)
        const newIndex = prev.findIndex(c => c.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

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
      {/* Sortable header */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
        <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex text-sm">
              {columns.map(col => (
                <SortableColumnHeader key={col.id} column={col} />
              ))}
            </div>
          </div>
        </SortableContext>
      </DndContext>

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
            return (
              <div
                key={ticket.id}
                className="absolute top-0 left-0 w-full flex items-center text-sm border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map(col => (
                  <div key={col.id} className={`px-4 ${col.width} ${col.visibility ?? ''} min-w-0`}>
                    <TicketCell columnId={col.id} ticket={ticket} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
