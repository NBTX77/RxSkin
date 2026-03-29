'use client'

import { useState } from 'react'
import type { Ticket } from '@/types'
import { X, CheckCircle2, Clock, Send } from 'lucide-react'

interface QuickClosePanelProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { note: string; hours: number; notifyClient: boolean }) => void
}

export function QuickClosePanel({ ticket, isOpen, onClose, onConfirm }: QuickClosePanelProps) {
  const [note, setNote] = useState('')
  const [hours, setHours] = useState(ticket.actualHours ?? 0.5)
  const [notifyClient, setNotifyClient] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await onConfirm({ note, hours, notifyClient })
    setSubmitting(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div role="dialog" aria-modal="true" aria-label="Close Ticket" className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" />
            <h2 className="text-base font-semibold text-white">Close Ticket</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Ticket summary */}
        <div className="px-5 py-3 bg-gray-800/50 border-b border-gray-800">
          <p className="text-xs text-gray-500 font-mono">#{ticket.id}</p>
          <p className="text-sm text-gray-200 font-medium mt-0.5">{ticket.summary}</p>
          <p className="text-xs text-gray-500 mt-1">{ticket.company}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Resolution note */}
            <div>
              <label htmlFor="resolution-note" className="block text-sm font-medium text-gray-300 mb-1.5">
                Resolution Note <span className="text-red-400">*</span>
              </label>
              <textarea
                id="resolution-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What was done to resolve this ticket..."
                rows={4}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Time entry */}
            <div>
              <label htmlFor="time-hours" className="block text-sm font-medium text-gray-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  Time Spent (hours)
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="time-hours"
                  type="number"
                  step="0.25"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-1">
                  {[0.25, 0.5, 1, 2].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHours(h)}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                        hours === h
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notify client */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyClient}
                onChange={(e) => setNotifyClient(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
              />
              <div>
                <span className="text-sm text-gray-300">Notify client</span>
                <p className="text-xs text-gray-500">Send resolution email to {ticket.contact ?? 'contact'}</p>
              </div>
            </label>
          </div>

          {/* Footer actions */}
          <div className="px-5 py-4 border-t border-gray-800 bg-gray-900/80 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!note.trim() || submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-green-500 focus:outline-none"
            >
              <Send size={14} />
              {submitting ? 'Closing...' : 'Close Ticket'}
            </button>
          </div>

          <div className="px-5 pb-3 text-center">
            <p className="text-[11px] text-gray-600">
              Ctrl+Enter to confirm
            </p>
          </div>
        </form>
      </div>
    </>
  )
}
