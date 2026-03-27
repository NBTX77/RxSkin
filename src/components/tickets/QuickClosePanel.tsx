'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'

interface QuickClosePanelProps {
  ticketId: number
  onClose: () => void
  onSuccess: () => void
}

const resolutions = [
  { id: 1, name: 'Resolved' },
  { id: 2, name: 'Deferred' },
  { id: 3, name: 'Duplicate' },
  { id: 4, name: 'No Further Action' },
]

async function closeTicket(
  ticketId: number,
  data: {
    resolutionId: number
    summary?: string
    internalNotes?: string
    timeSpent?: number
  }
) {
  const response = await fetch(`/api/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
      { op: 'replace', path: '/status', value: 'closed' },
      { op: 'replace', path: '/resolutionId', value: data.resolutionId },
      ...(data.summary ? [{ op: 'replace', path: '/resolution', value: data.summary }] : []),
      ...(data.internalNotes ? [{ op: 'add', path: '/internalNotes', value: data.internalNotes }] : []),
    ]),
  })

  if (!response.ok) throw new Error('Failed to close ticket')
  return response.json()
}

export function QuickClosePanel({ ticketId, onClose, onSuccess }: QuickClosePanelProps) {
  const [selectedResolution, setSelectedResolution] = useState(resolutions[0].id)
  const [summary, setSummary] = useState('')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      closeTicket(ticketId, {
        resolutionId: selectedResolution,
        summary: summary || undefined,
        internalNotes: notes || undefined,
      }),
    onSuccess,
  })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-lg font-semibold text-white">Close Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-400 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Resolution selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Resolution
            </label>
            <div className="space-y-2">
              {resolutions.map(res => (
                <label
                  key={res.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="resolution"
                    value={res.id}
                    checked={selectedResolution === res.id}
                    onChange={e => setSelectedResolution(Number(e.target.value))}
                    className="w-4 h-4 rounded-full"
                  />
                  <span className="text-sm text-gray-300">{res.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Resolution summary */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Resolution Summary (optional)
            </label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Brief summary of resolution..."
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          {/* Internal notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Internal Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes for the team..."
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-4 border-t border-gray-800 sticky bottom-0 bg-gray-900">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 rounded bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Close Ticket
          </button>
        </div>
      </div>
    </div>
  )
}
