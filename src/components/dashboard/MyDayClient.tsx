'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import type { Ticket, ScheduleEntry } from '@/types'
import { TicketCard } from '@/components/tickets/TicketCard'
import {
  Clock, Ticket as TicketIcon, Calendar, AlertTriangle,
  CheckCircle2, ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export function MyDayClient() {
  const { data: session } = useSession()
  const userName = session?.user?.name?.split(' ')[0] ?? 'there'

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const res = await fetch('/api/tickets')
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 30_000,
  })

  const { data: schedule = [], isLoading: scheduleLoading } = useQuery<ScheduleEntry[]>({
    queryKey: ['my-schedule'],
    queryFn: async () => {
      const res = await fetch('/api/schedule')
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 30_000,
  })

  // Stats
  const openTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed')
  const myTickets = openTickets.filter(t => t.assignedTo === session?.user?.name)
  const criticalTickets = openTickets.filter(t => t.priority === 'Critical' || t.priority === 'High')
  const todaySchedule = schedule.filter(e => {
    try {
      return format(new Date(e.start), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    } catch { return false }
  })

  // Determine greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">{greeting}, {userName}</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<TicketIcon size={18} />}
          label="Open Tickets"
          value={String(openTickets.length)}
          color="blue"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="My Tickets"
          value={String(myTickets.length)}
          color="purple"
        />
        <StatCard
          icon={<Calendar size={18} />}
          label="Scheduled Today"
          value={String(todaySchedule.length)}
          color="green"
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="High Priority"
          value={String(criticalTickets.length)}
          color="red"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Schedule Timeline (2/5) */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Calendar size={15} className="text-blue-400" />
                Today&apos;s Schedule
              </h2>
              <Link href="/schedule" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                View all <ChevronRight size={12} />
              </Link>
            </div>

            {scheduleLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-gray-800 animate-pulse" />)}
              </div>
            ) : todaySchedule.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {todaySchedule.map((entry) => (
                  <ScheduleItem key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-600 text-sm">
                Nothing scheduled today
              </div>
            )}
          </div>
        </div>

        {/* My Tickets (3/5) */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <TicketIcon size={15} className="text-purple-400" />
                My Open Tickets
              </h2>
              <Link href="/tickets" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                View all <ChevronRight size={12} />
              </Link>
            </div>

            {ticketsLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-lg bg-gray-800 animate-pulse" />)}
              </div>
            ) : myTickets.length > 0 ? (
              <div className="p-3 space-y-2">
                {myTickets.slice(0, 8).map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} compact />
                ))}
                {myTickets.length > 8 && (
                  <Link href="/tickets" className="block text-center text-xs text-blue-400 hover:text-blue-300 py-2">
                    +{myTickets.length - 8} more tickets
                  </Link>
                )}
              </div>
            ) : openTickets.length > 0 ? (
              <div className="p-3 space-y-2">
                <p className="text-xs text-gray-500 px-1 pb-1">All open tickets:</p>
                {openTickets.slice(0, 8).map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} compact />
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <CheckCircle2 size={24} className="text-green-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">All clear! No open tickets.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: 'blue' | 'purple' | 'green' | 'red'
}) {
  const styles = {
    blue:   'bg-blue-500/5 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/5 border-purple-500/20 text-purple-400',
    green:  'bg-green-500/5 border-green-500/20 text-green-400',
    red:    'bg-red-500/5 border-red-500/20 text-red-400',
  }

  return (
    <div className={`rounded-xl border p-4 ${styles[color]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">
        {icon}
        <span className="text-xs font-medium text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function ScheduleItem({ entry }: { entry: ScheduleEntry }) {
  let startTime = ''
  let endTime = ''
  try {
    startTime = format(new Date(entry.start), 'h:mm a')
    endTime = format(new Date(entry.end), 'h:mm a')
  } catch { /* ignore */ }

  return (
    <Link
      href={entry.ticketId ? `/tickets/${entry.ticketId}` : '/schedule'}
      className="block px-4 py-3 hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 text-center">
          <p className="text-xs font-medium text-blue-400">{startTime}</p>
          <p className="text-[10px] text-gray-600">{endTime}</p>
        </div>
        <div className="h-10 w-0.5 bg-blue-500/30 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 font-medium truncate">
            {entry.ticketSummary ?? 'Appointment'}
          </p>
          <p className="text-xs text-gray-500">{entry.companyName ?? entry.type}</p>
        </div>
      </div>
    </Link>
  )
}
