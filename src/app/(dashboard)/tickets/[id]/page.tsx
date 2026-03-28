'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Building2, User, Clock, Calendar, Tag,
  MessageSquare, Timer, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react'
import { useState } from 'react'

/* ---------- types (local, matching API response) ---------- */
interface Ticket {
  id: number
  summary: string
  status: string
  priority: string
  board: string
  company: string
  companyId?: number
  contact?: string
  assignedTo?: string
  budgetHours?: number
  actualHours?: number
  createdAt: string
  updatedAt: string
  closedAt?: string
  resources?: { memberId: number; memberName: string; primaryFlag: boolean }[]
}

interface TicketNote {
  id: number
  ticketId: number
  text: string
  isInternal: boolean
  createdBy: string
  createdAt: string
}

interface TimeEntry {
  id: number
  ticketId: number
  memberName: string
  hoursWorked: number
  workType?: string
  notes?: string
  billable: boolean
  date: string
}

/* ---------- helpers ---------- */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function priorityClasses(p: string) {
  const l = p.toLowerCase()
  if (l === 'critical') return 'bg-red-950 text-red-400 border border-red-800'
  if (l === 'high') return 'bg-orange-950 text-orange-400 border border-orange-800'
  if (l === 'medium') return 'bg-yellow-950 text-yellow-400 border border-yellow-800'
  return 'bg-green-950 text-green-400 border border-green-800'
}

function statusClasses(s: string) {
  const l = s.toLowerCase()
  if (l === 'resolved' || l === 'closed') return 'bg-green-950 text-green-400 border border-green-800'
  if (l === 'in progress') return 'bg-blue-950 text-blue-400 border border-blue-800'
  if (l.includes('waiting')) return 'bg-yellow-950 text-yellow-400 border border-yellow-800'
  if (l === 'scheduled') return 'bg-purple-950 text-purple-400 border border-purple-800'
  return 'bg-gray-800 text-gray-300 border border-gray-700'
}

/* ---------- component ---------- */
export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const ticketId = parseInt(id, 10)

  const [activeTab, setActiveTab] = useState<'notes' | 'time'>('notes')

  /* ticket */
  const { data: ticket, isLoading, error } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}`)
      if (!res.ok) throw new Error('Failed to load ticket')
      return res.json()
    },
    enabled: !isNaN(ticketId),
  })

  /* notes */
  const { data: notes = [] } = useQuery<TicketNote[]>({
    queryKey: ['ticket-notes', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/notes`)
      if (!res.ok) throw new Error('Failed to load notes')
      return res.json()
    },
    enabled: !isNaN(ticketId),
  })

  /* time entries */
  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['ticket-time', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/time-entries`)
      if (!res.ok) throw new Error('Failed to load time entries')
      return res.json()
    },
    enabled: !isNaN(ticketId),
  })

  const totalHours = timeEntries.reduce((s, e) => s + e.hoursWorked, 0)

  /* ---------- loading / error ---------- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 lg:ml-64 flex items-center justify-center">
        <div className="text-gray-400">Loading ticket...</div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-950 lg:ml-64 pb-20 lg:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/tickets" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={18} /> Back to Tickets
          </Link>
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <span>Ticket not found or failed to load.</span>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-gray-950 lg:ml-64 pb-20 lg:pb-0">
      {/* Back link + header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/tickets" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-2 transition-colors">
            <ArrowLeft size={16} /> Tickets
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-xl font-bold text-white">#{ticket.id}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${statusClasses(ticket.status)}`}>
                {ticket.status}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${priorityClasses(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
          </div>
          <p className="text-white mt-1 text-base">{ticket.summary}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Detail cards — responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Company */}
          <div className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <Building2 size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Company</div>
              <div className="text-sm text-white">{ticket.company}</div>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <User size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Contact</div>
              <div className="text-sm text-white">{ticket.contact || '—'}</div>
            </div>
          </div>

          {/* Assigned To */}
          <div className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <User size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Assigned To</div>
              <div className="text-sm text-white">{ticket.assignedTo || 'Unassigned'}</div>
            </div>
          </div>

          {/* Board */}
          <div className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <Tag size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Board</div>
              <div className="text-sm text-white">{ticket.board}</div>
            </div>
          </div>

          {/* Hours */}
          <div className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <Timer size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Hours (Actual / Budget)</div>
              <div className="text-sm text-white">
                {ticket.actualHours ?? 0}h / {ticket.budgetHours ?? 0}h
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <Calendar size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Created</div>
              <div className="text-sm text-white">{fmtDate(ticket.createdAt)}</div>
              <div className="text-xs text-gray-500 mt-1.5 mb-0.5">Updated</div>
              <div className="text-sm text-white">{fmtDate(ticket.updatedAt)}</div>
              {ticket.closedAt && (
                <>
                  <div className="text-xs text-gray-500 mt-1.5 mb-0.5">Closed</div>
                  <div className="text-sm text-white">{fmtDate(ticket.closedAt)}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Notes / Time Entries */}
        <div className="border-b border-gray-800 mb-4 flex gap-1">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare size={16} /> Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('time')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'time'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Clock size={16} /> Time ({totalHours.toFixed(1)}h)
          </button>
        </div>

        {/* Notes tab */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No notes yet.</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 rounded-lg border ${
                    note.isInternal
                      ? 'bg-yellow-950/30 border-yellow-900/50'
                      : 'bg-gray-900 border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{note.createdBy}</span>
                      {note.isInternal && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-900/60 text-yellow-400 rounded uppercase">
                          Internal
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{fmtShortDate(note.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{note.text}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Time entries tab */}
        {activeTab === 'time' && (
          <div className="space-y-3">
            {timeEntries.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No time entries yet.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">Member</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">Date</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">Hours</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">Type</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-800 last:border-0">
                          <td className="px-4 py-2.5 text-sm text-white">{entry.memberName}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-400">{fmtShortDate(entry.date)}</td>
                          <td className="px-4 py-2.5 text-sm text-white font-medium">{entry.hoursWorked}h</td>
                          <td className="px-4 py-2.5 text-sm text-gray-400">{entry.workType || '—'}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-400">{entry.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-800/50">
                        <td className="px-4 py-2.5 text-sm font-semibold text-white">Total</td>
                        <td></td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-white">{totalHours.toFixed(1)}h</td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {timeEntries.map((entry) => (
                    <div key={entry.id} className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{entry.memberName}</span>
                        <span className="text-sm font-semibold text-white">{entry.hoursWorked}h</span>
                      </div>
                      <div className="text-xs text-gray-400">{fmtShortDate(entry.date)} · {entry.workType || 'General'}</div>
                      {entry.notes && <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>}
                    </div>
                  ))}
                  <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg flex justify-between">
                    <span className="text-sm font-semibold text-white">Total</span>
                    <span className="text-sm font-semibold text-white">{totalHours.toFixed(1)}h</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
