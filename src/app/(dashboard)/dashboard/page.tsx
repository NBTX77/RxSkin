'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Loader2, AlertCircle, Clock, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Ticket {
  id: number
  summary: string
  status: string
  priority: string
  company: string
  updatedAt: string
}

interface ScheduleEntry {
  id: number
  ticketSummary?: string
  memberName: string
  start: string
  end: string
  companyName?: string
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch { return '' }
}

export default function DashboardPage() {
  const { data: session } = useSession()

  const { data: ticketData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/tickets', 'dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/tickets?pageSize=50')
      if (!res.ok) throw new Error('Failed to fetch tickets')
      return res.json()
    },
    staleTime: 2 * 60 * 1000,
  })

  const today = new Date().toISOString().split('T')[0]
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['/api/schedule', today],
    queryFn: async () => {
      const res = await fetch(`/api/schedule?start=${today}&end=${today}`)
      if (!res.ok) throw new Error('Failed to fetch schedule')
      return res.json()
    },
    staleTime: 2 * 60 * 1000,
  })

  const tickets: Ticket[] = ticketData?.data ?? []
  const schedule: ScheduleEntry[] = scheduleData?.data ?? scheduleData ?? []

  const openTickets = tickets.filter(t => !t.status.toLowerCase().includes('closed'))
  const scheduledToday = Array.isArray(schedule) ? schedule.length : 0
  const firstName = session?.user?.name?.split(' ')[0] || 'there'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 px-4 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          {greeting}, {firstName}
        </h1>
        <p className="text-gray-400 text-sm mt-1">Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Tickets" value={ticketsLoading ? '...' : String(openTickets.length)} color="blue" />
        <StatCard label="Total Tickets" value={ticketsLoading ? '...' : String(tickets.length)} color="purple" />
        <StatCard label="Scheduled Today" value={scheduleLoading ? '...' : String(scheduledToday)} color="green" />
        <StatCard label="High Priority" value={ticketsLoading ? '...' : String(openTickets.filter(t => t.priority.toLowerCase().includes('high')).length)} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Tickets Panel */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Open Tickets</h2>
          {ticketsLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 size={18} className="text-gray-500 animate-spin" />
            </div>
          ) : openTickets.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No open tickets</p>
          ) : (
            <div className="space-y-2">
              {openTickets.slice(0, 8).map((t) => (
                <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <AlertCircle size={14} className={`mt-1 flex-shrink-0 ${t.priority.toLowerCase().includes('high') ? 'text-red-400' : 'text-gray-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{t.summary}</p>
                    <p className="text-xs text-gray-500">{t.company} &middot; {t.status}</p>
                  </div>
                </Link>
              ))}
              {openTickets.length > 8 && (
                <Link href="/tickets" className="block text-xs text-blue-400 hover:underline text-center pt-2">
                  View all {openTickets.length} open tickets
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Today's Schedule Panel */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Today&apos;s Schedule</h2>
          {scheduleLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 size={18} className="text-gray-500 animate-spin" />
            </div>
          ) : !Array.isArray(schedule) || schedule.length === 0 ? (
            <div className="text-center py-6">
              <Calendar size={24} className="mx-auto text-gray-700 mb-2" />
              <p className="text-sm text-gray-500">No schedule entries today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedule.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <Clock size={14} className="mt-1 flex-shrink-0 text-green-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{s.ticketSummary || 'Schedule Entry'}</p>
                    <p className="text-xs text-gray-500">
                      {formatTime(s.start)} – {formatTime(s.end)}
                      {s.companyName && ` · ${s.companyName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: 'blue' | 'purple' | 'green' | 'red' }) {
  const colorMap = {
    blue: 'bg-blue-950 border-blue-800 text-blue-400',
    purple: 'bg-purple-950 border-purple-800 text-purple-400',
    green: 'bg-green-950 border-green-800 text-green-400',
    red: 'bg-red-950 border-red-800 text-red-400',
  }
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
    </div>
  )
}
