'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MoreVertical, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { QuickClosePanel } from '@/components/tickets/QuickClosePanel'
import { Skeleton } from '@/components/ui/skeleton'

interface Activity {
  id: number
  type: 'comment' | 'status_change' | 'assignment' | 'time_entry'
  author?: { name: string }
  timestamp: string
  text?: string
  change?: { from: string; to: string }
  duration?: number
}

interface Ticket {
  id: number
  summary: string
  description?: string
  priority: number
  status: { name: string }
  dateEntered: string
  company: { name: string }
  owner?: { name: string }
  board?: { name: string }
  recordType: string
  source?: { name: string }
  contact?: { name: string; email?: string }
}

async function fetchTicketDetail(id: number) {
  const response = await fetch(`/api/tickets/${id}`)
  if (!response.ok) throw new Error('Failed to fetch ticket')
  return response.json()
}

async function fetchTicketNotes(id: number) {
  const response = await fetch(`/api/tickets/${id}/notes`)
  if (!response.ok) throw new Error('Failed to fetch notes')
  return response.json()
}

async function updateTicket(id: number, patch: unknown[]) {
  const response = await fetch(`/api/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!response.ok) throw new Error('Failed to update ticket')
  return response.json()
}

async function addTicketNote(id: number, text: string) {
  const response = await fetch(`/api/tickets/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) throw new Error('Failed to add note')
  return response.json()
}

const priorityColors: Record<number, string> = {
  1: 'text-red-400',
  2: 'text-orange-400',
  3: 'text-yellow-400',
  4: 'text-green-400',
}

const priorityLabels: Record<number, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
}

export function TicketDetail({ ticketId }: { ticketId: number }) {
  const [showClosePanel, setShowClosePanel] = useState(false)
  const [noteText, setNoteText] = useState('')
  const queryClient = useQueryClient()

  const {
    data: ticket,
    isLoading: ticketLoading,
    error: ticketError,
  } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId],
    queryFn: () => fetchTicketDetail(ticketId),
    staleTime: 30 * 1000,
  })

  const {
    data: activities,
    isLoading: activitiesLoading,
  } = useQuery<Activity[]>({
    queryKey: ['ticket:notes', ticketId],
    queryFn: () => fetchTicketNotes(ticketId),
    staleTime: 30 * 1000,
  })

  const updateMutation = useMutation({
    mutationFn: (patch: unknown[]) => updateTicket(ticketId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })

  const noteMutation = useMutation({
    mutationFn: (text: string) => addTicketNote(ticketId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket:notes', ticketId] })
      setNoteText('')
    },
  })

  if (ticketError) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>Unable to load ticket</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-800">
          <Link
            href="/tickets"
            className="text-gray-500 hover:text-gray-400 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            {ticketLoading ? (
              <Skeleton className="h-6 w-1/2" />
            ) : (
              <h1 className="text-lg font-semibold text-white truncate">
                #{ticket?.id} – {ticket?.summary}
              </h1>
            )}
          </div>
          <button className="text-gray-500 hover:text-gray-400 transition-colors p-2">
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto flex gap-4 p-4">
          {/* Activity feed (2/3) */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* Status/Info card */}
            {ticketLoading ? (
              <Skeleton className="h-32" />
            ) : ticket ? (
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className="text-sm text-white font-medium">{ticket.status.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Priority</p>
                  <p className={`text-sm font-medium ${priorityColors[ticket.priority] || priorityColors[4]}`}>
                    {priorityLabels[ticket.priority] || 'Low'}
                  </p>
                </div>
                {ticket.description && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-300">{ticket.description}</p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Activity feed */}
            <div className="space-y-3">
              {activitiesLoading ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)
              ) : activities && activities.length > 0 ? (
                activities.map(activity => (
                  <div
                    key={activity.id}
                    className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-sm"
                  >
                    {activity.type === 'comment' ? (
                      <div>
                        <p className="text-gray-400 text-xs mb-2">
                          {activity.author?.name} • {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-white">{activity.text}</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs">
                        {activity.author?.name} — {activity.type.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 text-sm py-4">No activity yet</p>
              )}
            </div>

            {/* Add note */}
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={16} className="text-gray-500" />
                <p className="text-sm text-gray-400">Add a note</p>
              </div>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Type a note..."
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <button
                onClick={() => noteMutation.mutate(noteText)}
                disabled={!noteText.trim() || noteMutation.isPending}
                className="mt-3 px-3 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-600 transition-colors"
              >
                Post Note
              </button>
            </div>
          </div>

          {/* Sidebar (1/3) */}
          <div className="w-80 flex-shrink-0 space-y-4">
            {ticketLoading ? (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </>
            ) : ticket ? (
              <>
                {/* Contact info */}
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 space-y-3">
                  <h3 className="text-sm font-semibold text-white">Company</h3>
                  <p className="text-sm text-gray-300">{ticket.company.name}</p>
                  {ticket.contact && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Contact</p>
                      <p className="text-sm text-gray-300">{ticket.contact.name}</p>
                      {ticket.contact.email && (
                        <p className="text-xs text-gray-500">{ticket.contact.email}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Assignment & Details */}
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                    <p className="text-sm text-gray-300">{ticket.owner?.name || 'Unassigned'}</p>
                  </div>
                  {ticket.board && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Board</p>
                      <p className="text-sm text-gray-300">{ticket.board.name}</p>
                    </div>
                  )}
                  {ticket.source && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Source</p>
                      <p className="text-sm text-gray-300">{ticket.source.name}</p>
                    </div>
                  )}
                </div>

                {/* Quick close */}
                <button
                  onClick={() => setShowClosePanel(true)}
                  className="w-full px-4 py-2 rounded bg-green-600/20 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-600/30 transition-colors"
                >
                  Close Ticket
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Quick close panel */}
      {showClosePanel && (
        <QuickClosePanel
          ticketId={ticketId}
          onClose={() => setShowClosePanel(false)}
          onSuccess={() => {
            setShowClosePanel(false)
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
          }}
        />
      )}
    </>
  )
}
