'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/StatCard'
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

interface DashboardMetrics {
  totalTickets: number
  openTickets: number
  awaitingAction: number
  overdueTickets: number
  recentTickets: Ticket[]
}

async function fetchDashboardMetrics() {
  const response = await fetch('/api/dashboard/metrics')
  if (!response.ok) throw new Error('Failed to fetch dashboard metrics')
  return response.json()
}

export function MyDayClient() {
  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard:metrics'],
    queryFn: fetchDashboardMetrics,
    staleTime: 30 * 1000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>

        {/* Tickets skeleton */}
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="text-center text-gray-400">
        <p>Unable to load dashboard metrics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open Tickets"
          value={metrics.openTickets}
          total={metrics.totalTickets}
          color="blue"
        />
        <StatCard
          label="Awaiting Action"
          value={metrics.awaitingAction}
          total={metrics.totalTickets}
          color="purple"
        />
        <StatCard
          label="Overdue"
          value={metrics.overdueTickets}
          total={metrics.totalTickets}
          color="red"
        />
        <StatCard
          label="Total Tickets"
          value={metrics.totalTickets}
          total={metrics.totalTickets}
          color="green"
        />
      </div>

      {/* Recent tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Tickets</h2>
          <Link href="/tickets" className="text-blue-400 hover:text-blue-300 text-sm">
            View All
          </Link>
        </div>

        <div className="space-y-2">
          {metrics.recentTickets.length > 0 ? (
            metrics.recentTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No recent tickets</p>
          )}
        </div>
      </div>
    </div>
  )
}
