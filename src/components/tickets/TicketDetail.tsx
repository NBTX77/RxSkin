'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { Ticket, TicketNote, TimeEntry } from '@/types'
import { QuickClosePanel } from './QuickClosePanel'
import { TicketActions } from '@/components/remote/TicketActions'
import { useTimeTracker } from '@/contexts/TimeTrackerContext'
import {
  ArrowLeft, Clock, Building2, User, MessageSquare, Send,
  CheckCircle2, Calendar, AlertCircle, Timer, Tag, ArrowUpCircle,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

const PRIORITY_DOT: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-blue-500',
  Low: 'bg-gray-500',
}

const STATUS_STYLES: Record<string, string> = {
  'New': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'In Progress': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Waiting on Client': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Scheduled': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'Resolved': 'text-green-400 bg-green-500/10 border-green-500/20',
  'Closed': 'text-gray-500 bg-gray-500/10 border-gray-500/20',
}

interface TicketDetailProps {
  ticketId: number
}

export function TicketDetail({ ticketId }: TicketDetailProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [newNote, setNewNote] = useState('')
  const [showClosePanel, setShowClosePanel] = useState(false)
  const [activeTab, setActiveTab] = useState<'notes' | 'time'>('notes')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showTimeForm, setShowTimeForm] = useState(false)
  const [timeHours, setTimeHours] = useState(0.5)
  const [timeNotes, setTimeNotes] = useState('')
  const { startTimer, activeTicketId: timerTicketId, isRunning: timerRunning } = useTimeTracker()

  const { data: ticket, isLoading: ticketLoading } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}`)
      if (!res.ok) throw new Error('Failed to load ticket')
      return res.json()
    },
  })

  const { data: notes = [] } = useQuery<TicketNote[]>({
    queryKey: ['ticket-notes', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/notes`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!ticket,
  })

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['ticket-time', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/time-entries`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!ticket,
  })

  if (ticketLoading || !ticket) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  const dotColor = PRIORITY_DOT[ticket.priority] ?? 'bg-gray-500'
  const statusStyle = STATUS_STYLES[ticket.status] ?? 'text-gray-600 dark:text-gray-400 bg-gray-500/10 border-gray-500/20'
  const totalTime = timeEntries.reduce((sum, e) => sum + e.hoursWorked, 0)

  return (
    <div className="space-y-4">
      {/* Back + Quick Actions Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => ticket && startTimer(ticket.id, ticket.summary)}
            disabled={timerRunning && timerTicketId === ticket?.id}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              timerRunning && timerTicketId === ticket?.id
                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 cursor-default'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Timer size={13} />
            {timerRunning && timerTicketId === ticket?.id ? 'Timer Running' : timerRunning ? 'Switch Timer' : 'Start Timer'}
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700 hover:text-gray-900 dark:text-white transition-colors flex items-center gap-1.5">
            <Calendar size={13} />
            Schedule
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700 hover:text-gray-900 dark:text-white transition-colors flex items-center gap-1.5">
            <User size={13} />
            Reassign
          </button>
          <button
            onClick={() => setShowClosePanel(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/20 transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 size={13} />
            Close Ticket
          </button>
        </div>
      </div>

      {/* Main content: Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Activity Feed (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ticket header */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-start gap-3">
              <span className={`inline-block w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono text-gray-500">#{ticket.id}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusStyle}`}>
                    {ticket.status}
                  </span>
                  <span className="text-xs text-gray-600 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{ticket.priority}</span>
                </div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">{ticket.summary}</h1>
              </div>
            </div>
          </div>

          {/* Add note inline */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                TB
              </div>
              <div className="flex-1">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note... (Enter to send)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                      <input id="note-internal" type="checkbox" className="w-3 h-3 rounded border-gray-600 bg-gray-100 dark:bg-gray-800" />
                      Internal
                    </label>
                  </div>
                  <button
                    disabled={!newNote.trim() || actionLoading === 'note'}
                    onClick={async () => {
                      setActionLoading('note')
                      const isInternal = (document.getElementById('note-internal') as HTMLInputElement)?.checked ?? false
                      await fetch(`/api/tickets/${ticketId}/notes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: newNote, isInternal }),
                      })
                      queryClient.invalidateQueries({ queryKey: ['ticket-notes', ticketId] })
                      setNewNote('')
                      setActionLoading(null)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
                  >
                    <Send size={12} />
                    {actionLoading === 'note' ? 'Sending...' : 'Add Note'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tab toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-1">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'notes' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('time')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'time' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              Time ({timeEntries.length}) — {totalTime}h
            </button>
          </div>

          {/* Activity feed */}
          {activeTab === 'notes' ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className={`rounded-xl border p-4 ${note.isInternal ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300">
                      {note.createdBy.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{note.createdBy}</span>
                    {note.isInternal && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">Internal</span>
                    )}
                    <span className="text-xs text-gray-600 ml-auto">
                      {(() => { try { return formatDistanceToNow(new Date(note.createdAt), { addSuffix: true }) } catch { return 'Unknown' } })()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{note.text}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-center text-gray-600 py-8 text-sm">No notes yet</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{entry.memberName}</span>
                      <span className="text-xs text-gray-600">{entry.workType}</span>
                    </div>
                    {entry.notes && <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{entry.hoursWorked}h</p>
                    <p className="text-xs text-gray-600">
                      {entry.billable ? 'Billable' : 'Non-billable'}
                    </p>
                  </div>
                </div>
              ))}
              {timeEntries.length === 0 && (
                <p className="text-center text-gray-600 py-8 text-sm">No time entries</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Metadata sidebar (1/3 width) */}
        <div className="space-y-4">
          {/* Key info */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Details</h3>

            <div className="space-y-3">
              <DetailRow icon={<Tag size={14} />} label="Board" value={ticket.board} />
              <DetailRow icon={<AlertCircle size={14} />} label="Priority" value={ticket.priority} />
              <DetailRow icon={<Building2 size={14} />} label="Company" value={ticket.company} />
              {ticket.contact && <DetailRow icon={<MessageSquare size={14} />} label="Contact" value={ticket.contact} />}
              {ticket.assignedTo && <DetailRow icon={<User size={14} />} label="Assigned" value={ticket.assignedTo} />}
              <DetailRow icon={<Calendar size={14} />} label="Created" value={formatDate(ticket.createdAt)} />
              <DetailRow icon={<Clock size={14} />} label="Updated" value={formatDate(ticket.updatedAt)} />
            </div>
          </div>

          {/* Hours */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Time</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalTime}</p>
                <p className="text-[11px] text-gray-500">Actual</p>
              </div>
              <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{ticket.budgetHours ?? '—'}</p>
                <p className="text-[11px] text-gray-500">Budget</p>
              </div>
            </div>
            {ticket.budgetHours && ticket.budgetHours > 0 && (
              <div className="mt-3">
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      totalTime / ticket.budgetHours > 0.9 ? 'bg-red-500' :
                      totalTime / ticket.budgetHours > 0.7 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min((totalTime / ticket.budgetHours) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {/* Change Status */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  disabled={actionLoading === 'status'}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
                >
                  {actionLoading === 'status' ? 'Updating...' : 'Change Status'}
                </button>
                {showStatusMenu && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-gray-100 dark:bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1">
                    {['New', 'In Progress', 'Waiting on Client', 'Scheduled', 'Resolved', 'Closed'].map((status) => (
                      <button
                        key={status}
                        onClick={async () => {
                          setShowStatusMenu(false)
                          setActionLoading('status')
                          await fetch(`/api/tickets/${ticketId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify([
                              { op: 'replace', path: '/status', value: { name: status } },
                            ]),
                          })
                          queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
                          setActionLoading(null)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                          ticket.status === status ? 'text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Time Entry */}
              <div>
                <button
                  onClick={() => setShowTimeForm(!showTimeForm)}
                  disabled={actionLoading === 'time'}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors text-purple-400 hover:bg-purple-500/10 disabled:opacity-50"
                >
                  {actionLoading === 'time' ? 'Adding...' : 'Add Time Entry'}
                </button>
                {showTimeForm && (
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        max="24"
                        value={timeHours}
                        onChange={(e) => setTimeHours(parseFloat(e.target.value) || 0.25)}
                        className="w-20 px-2 py-1 rounded bg-white dark:bg-gray-900 border border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <span className="text-xs text-gray-500">hours</span>
                    </div>
                    <input
                      type="text"
                      value={timeNotes}
                      onChange={(e) => setTimeNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      className="w-full px-2 py-1 rounded bg-white dark:bg-gray-900 border border-gray-700 text-gray-900 dark:text-white text-xs placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={async () => {
                        setActionLoading('time')
                        await fetch(`/api/tickets/${ticketId}/time-entries`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ actualHours: timeHours, notes: timeNotes || undefined }),
                        })
                        queryClient.invalidateQueries({ queryKey: ['ticket-time', ticketId] })
                        setShowTimeForm(false)
                        setTimeHours(0.5)
                        setTimeNotes('')
                        setActionLoading(null)
                      }}
                      className="w-full px-2 py-1.5 rounded text-xs font-medium bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                    >
                      Add Entry
                    </button>
                  </div>
                )}
              </div>

              {/* Escalate */}
              <button
                onClick={async () => {
                  setActionLoading('escalate')
                  await fetch(`/api/tickets/${ticketId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify([
                      { op: 'replace', path: '/priority', value: { name: 'Critical' } },
                    ]),
                  })
                  await fetch(`/api/tickets/${ticketId}/notes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: 'Ticket escalated to Critical priority.', isInternal: true }),
                  })
                  queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
                  queryClient.invalidateQueries({ queryKey: ['ticket-notes', ticketId] })
                  setActionLoading(null)
                }}
                disabled={actionLoading === 'escalate' || ticket.priority === 'Critical'}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors text-orange-400 hover:bg-orange-500/10 disabled:opacity-50 flex items-center gap-1.5"
              >
                <ArrowUpCircle size={13} />
                {actionLoading === 'escalate' ? 'Escalating...' : ticket.priority === 'Critical' ? 'Already Critical' : 'Escalate'}
              </button>
            </div>
          </div>

          {/* Remote Tools (ScreenConnect + Automate) */}
          <TicketActions ticket={ticket} />
        </div>
      </div>

      {/* Quick Close Panel */}
      <QuickClosePanel
        ticket={ticket}
        isOpen={showClosePanel}
        onClose={() => setShowClosePanel(false)}
        onSuccess={() => {
          setShowClosePanel(false)
        }}
      />
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-xs text-gray-500">
        {icon}
        {label}
      </span>
      <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{value}</span>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'MMM d, h:mm a')
  } catch {
    return dateStr
  }
}
