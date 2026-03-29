'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import type { Ticket, ScheduleEntry } from '@/types'
import { TicketCard } from '@/components/tickets/TicketCard'
import {
  Clock, Ticket as TicketIcon, Calendar, AlertTriangle,
  CheckCircle2, ChevronRight, Mail, Cloud,
} from 'lucide-react'
import { KPICard } from '@/components/ui/KPICard'
import { format } from 'date-fns'
import Link from 'next/link'
import { TicketCardSkeleton } from '@/components/ui/TicketCardSkeleton'

export function MyDayClient() {
  const { data: session } = useSession()

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

  return (
    <div className="space-y-6" data-feedback-component="MyDay">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <KPICard
          icon={TicketIcon}
          color="bg-blue-500"
          label="Open Tickets"
          value={openTickets.length}
        />
        <KPICard
          icon={Clock}
          color="bg-purple-500"
          label="My Tickets"
          value={myTickets.length}
        />
        <KPICard
          icon={Calendar}
          color="bg-emerald-500"
          label="Scheduled Today"
          value={todaySchedule.length}
        />
        <KPICard
          icon={AlertTriangle}
          color="bg-red-500"
          label="High Priority"
          value={criticalTickets.length}
        />
      </div>

      {/* M365 Widgets Row */}
      <M365WidgetsRow />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Schedule Timeline (2/5) */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Calendar size={15} className="text-blue-400" />
                Today&apos;s Schedule
              </h2>
              <Link href="/schedule" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                View all <ChevronRight size={12} />
              </Link>
            </div>

            {scheduleLoading ? (
              <div className="p-4 space-y-3">
                {[0,1,2].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse" style={{ animationDelay: `${i * 75}ms` }}>
                    <div className="w-12 space-y-1">
                      <div className="h-3 w-10 bg-gray-200 dark:bg-gray-800 rounded mx-auto" />
                      <div className="h-2 w-8 bg-gray-200 dark:bg-gray-800 rounded mx-auto" />
                    </div>
                    <div className="h-10 w-0.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                      <div className="h-2.5 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : todaySchedule.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
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
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <TicketIcon size={15} className="text-purple-400" />
                My Open Tickets
              </h2>
              <Link href="/tickets" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                View all <ChevronRight size={12} />
              </Link>
            </div>

            {ticketsLoading ? (
              <div className="p-3 space-y-2">
                {[0,1,2,3].map(i => <TicketCardSkeleton key={i} style={{ animationDelay: `${i * 75}ms` }} />)}
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
                <p className="text-gray-600 dark:text-gray-400 text-sm">All clear! No open tickets.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function M365WidgetsRow() {
  const today = new Date()
  const startDateTime = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endDateTime = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const { data: mailData, error: mailError } = useQuery({
    queryKey: ['m365-inbox-preview'],
    queryFn: async () => {
      const res = await fetch('/api/m365/mail?top=5')
      if (res.status === 403) return null // not connected
      if (!res.ok) throw new Error('Failed to fetch mail')
      return res.json()
    },
    staleTime: 30_000,
    retry: false,
  })

  const { data: calData, error: calError } = useQuery({
    queryKey: ['m365-calendar-today'],
    queryFn: async () => {
      const res = await fetch(`/api/m365/calendar?startDateTime=${startDateTime}&endDateTime=${endDateTime}&top=5`)
      if (res.status === 403) return null // not connected
      if (!res.ok) throw new Error('Failed to fetch calendar')
      return res.json()
    },
    staleTime: 30_000,
    retry: false,
  })

  // Don't render widgets if both return not-connected
  if (mailData === null && calData === null) return null
  // Don't render if both errored
  if (mailError && calError) return null

  const messages: Array<{id: string; subject: string; from?: {emailAddress?: {name?: string}}; receivedDateTime?: string; isRead?: boolean}> = mailData?.messages || mailData?.value || []
  const unreadMessages = messages.filter((m) => m.isRead === false)
  const events: Array<{id: string; subject: string; start?: {dateTime?: string}; location?: {displayName?: string}}> = calData?.value || calData?.events || []

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Inbox Preview */}
      {mailData !== null && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Mail size={15} className="text-blue-400" />
              Inbox
              {unreadMessages.length > 0 && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">{unreadMessages.length}</span>
              )}
            </h2>
            <Link href="/m365/mail" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
              Open <ChevronRight size={12} />
            </Link>
          </div>
          {messages.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">No messages</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {messages.slice(0, 5).map((msg) => (
                <Link key={msg.id} href="/m365/mail" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {!msg.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate ${!msg.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {msg.from?.emailAddress?.name || '—'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{msg.subject}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Today's Calendar */}
      {calData !== null && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Cloud size={15} className="text-blue-400" />
              Today&apos;s Meetings
            </h2>
            <Link href="/m365/calendar" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
              Open <ChevronRight size={12} />
            </Link>
          </div>
          {events.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">No meetings today</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {events.slice(0, 5).map((ev) => {
                let time = ''
                try { time = format(new Date(ev.start?.dateTime || ''), 'h:mm a') } catch { /* ignore */ }
                return (
                  <Link key={ev.id} href="/m365/calendar" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <span className="text-xs text-blue-400 w-14 flex-shrink-0">{time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{ev.subject}</p>
                      {ev.location?.displayName && (
                        <p className="text-xs text-gray-500 truncate">{ev.location.displayName}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
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
      className="block px-4 py-3 hover:bg-gray-100 dark:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 text-center">
          <p className="text-xs font-medium text-blue-400">{startTime}</p>
          <p className="text-[10px] text-gray-600">{endTime}</p>
        </div>
        <div className="h-10 w-0.5 bg-blue-500/30 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
            {entry.ticketSummary ?? 'Appointment'}
          </p>
          <p className="text-xs text-gray-500">{entry.companyName ?? entry.type}</p>
        </div>
      </div>
    </Link>
  )
}
