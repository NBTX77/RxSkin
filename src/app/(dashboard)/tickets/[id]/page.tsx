'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Building2, User, Clock, Calendar, Tag,
  MessageSquare, Timer, AlertCircle, Send, ChevronDown,
  CheckCircle2, Settings2,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

/* ---------- types ---------- */
interface Ticket {
  id: number
  summary: string
  status: string
  priority: string
  type?: string
  subType?: string
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

/* ---------- unified badge helper ---------- */
function badgeClasses(variant: 'priority' | 'status' | 'type', value: string) {
  const v = value.toLowerCase()
  // All badges: same shape, consistent border style
  const base = 'px-2 py-0.5 rounded text-xs font-medium border'
  if (variant === 'priority') {
    if (v === 'critical') return `${base} bg-red-500/10 text-red-400 border-red-500/30`
    if (v === 'high') return `${base} bg-orange-500/10 text-orange-400 border-orange-500/30`
    if (v === 'medium') return `${base} bg-yellow-500/10 text-yellow-400 border-yellow-500/30`
    return `${base} bg-green-500/10 text-green-400 border-green-500/30`
  }
  if (variant === 'status') {
    if (v === 'resolved' || v === 'closed') return `${base} bg-green-500/10 text-green-400 border-green-500/30`
    if (v === 'in progress') return `${base} bg-blue-500/10 text-blue-400 border-blue-500/30`
    if (v.includes('waiting')) return `${base} bg-yellow-500/10 text-yellow-400 border-yellow-500/30`
    if (v === 'scheduled' || v === 'schedule hold') return `${base} bg-purple-500/10 text-purple-400 border-purple-500/30`
    return `${base} bg-gray-500/10 text-gray-300 border-gray-500/30`
  }
  // type
  return `${base} bg-gray-500/10 text-gray-300 border-gray-500/30`
}

/* ---------- component ---------- */
export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const ticketId = parseInt(id, 10)
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'notes' | 'time'>('notes')
  const [showActions, setShowActions] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  // Close actions dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false)
      }
    }
    if (showActions) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showActions])

  /* ── data fetching ── */
  const { data: ticket, isLoading, error } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}`)
      if (!res.ok) throw new Error('Failed to load ticket')
      return res.json()
    },
    enabled: !isNaN(ticketId),
  })

  const { data: notes = [] } = useQuery<TicketNote[]>({
    queryKey: ['ticket-notes', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/notes`)
      if (!res.ok) throw new Error('Failed to load notes')
      return res.json()
    },
    enabled: !isNaN(ticketId),
  })

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

  /* ── sort notes oldest first ── */
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  /* ── mutations ── */
  const addNoteMutation = useMutation({
    mutationFn: async ({ text, isInternal }: { text: string; isInternal: boolean }) => {
      const res = await fetch(`/api/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, isInternal }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-notes', ticketId] })
    },
  })

  const updateTicketMutation = useMutation({
    mutationFn: async (patches: Array<{ op: string; path: string; value: unknown }>) => {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patches),
      })
      if (!res.ok) throw new Error('Failed to update ticket')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })

  /* ---------- loading / error ---------- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950  flex items-center justify-center">
        <div className="text-gray-400">Loading ticket...</div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-950  pb-20 lg:pb-0">
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

  /* ---------- quick actions ---------- */
  const quickActions = [
    {
      label: 'Mark Resolved',
      action: () => updateTicketMutation.mutate([
        { op: 'replace', path: 'status', value: { name: 'Resolved' } },
      ]),
    },
    {
      label: 'Set In Progress',
      action: () => updateTicketMutation.mutate([
        { op: 'replace', path: 'status', value: { name: 'In Progress' } },
      ]),
    },
    {
      label: 'Set Waiting Customer',
      action: () => updateTicketMutation.mutate([
        { op: 'replace', path: 'status', value: { name: 'Waiting Customer' } },
      ]),
    },
    {
      label: 'Set Schedule Hold',
      action: () => updateTicketMutation.mutate([
        { op: 'replace', path: 'status', value: { name: 'Schedule Hold' } },
      ]),
    },
    {
      label: 'Close Ticket',
      action: () => updateTicketMutation.mutate([
        { op: 'replace', path: 'status', value: { name: 'Closed' } },
      ]),
    },
  ]

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-gray-950  pb-20 lg:pb-0">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/tickets" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
              <ArrowLeft size={16} /> Tickets
            </Link>

            {/* Actions dropdown */}
            <div className="relative" ref={actionsRef}>
              <button
                onClick={() => setShowActions(!showActions)}
                disabled={updateTicketMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Settings2 size={14} />
                Actions
                <ChevronDown size={14} />
              </button>
              {showActions && (
                <div className="absolute right-0 mt-1 w-52 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                  {quickActions.map((qa) => (
                    <button
                      key={qa.label}
                      onClick={() => { qa.action(); setShowActions(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
            <h1 className="text-xl font-bold text-white">#{ticket.id}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={badgeClasses('status', ticket.status)}>{ticket.status}</span>
              <span className={badgeClasses('priority', ticket.priority)}>{ticket.priority}</span>
              {ticket.type && <span className={badgeClasses('type', ticket.type)}>{ticket.type}</span>}
            </div>
          </div>
          <p className="text-white mt-1 text-base">{ticket.summary}</p>
          {updateTicketMutation.isPending && (
            <div className="text-xs text-blue-400 mt-1">Updating ticket...</div>
          )}
          {updateTicketMutation.isError && (
            <div className="text-xs text-red-400 mt-1">Failed to update ticket</div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Detail cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <Building2 size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Company</div>
              <div className="text-sm text-white">{ticket.company}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <User size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Contact</div>
              <div className="text-sm text-white">{ticket.contact || '—'}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <User size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Assigned To</div>
              <div className="text-sm text-white">{ticket.assignedTo || 'Unassigned'}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <Tag size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Board</div>
              <div className="text-sm text-white">{ticket.board}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <Timer size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Hours (Actual / Budget)</div>
              <div className="text-sm text-white">
                {ticket.actualHours ?? 0}h / {ticket.budgetHours ?? 0}h
              </div>
            </div>
          </div>
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

        {/* Tabs */}
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
            {sortedNotes.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No notes yet.</p>
            ) : (
              sortedNotes.map((note) => (
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
                      {note.isInternal ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded">
                          Internal
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded">
                          Customer View
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{fmtShortDate(note.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                </div>
              ))
            )}

            {/* Add note form */}
            <AddNoteForm
              onSubmit={(text, isInternal) => addNoteMutation.mutate({ text, isInternal })}
              isPending={addNoteMutation.isPending}
            />
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

/* ====================== ADD NOTE FORM ====================== */
function AddNoteForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (text: string, isInternal: boolean) => void
  isPending: boolean
}) {
  const [text, setText] = useState('')
  const [isInternal, setIsInternal] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!text.trim() || isPending) return
    onSubmit(text.trim(), isInternal)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 mt-4">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a note..."
        rows={3}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => setIsInternal(!isInternal)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
            isInternal
              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
          }`}
        >
          {isInternal ? 'Internal' : 'Customer View'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          {isPending ? 'Sending...' : 'Add Note'}
        </button>
      </div>
      <p className="text-[10px] text-gray-600 mt-1">Ctrl+Enter to send</p>
    </div>
  )
}
