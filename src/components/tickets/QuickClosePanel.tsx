'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Ticket } from '@/types'
import { useCloseTicket } from '@/hooks/useCloseTicket'
import type { CloseTicketResult } from '@/hooks/useCloseTicket'
import { X, CheckCircle2, Clock, Send, Bell, BellOff, AlertTriangle, RotateCcw } from 'lucide-react'

interface QuickClosePanelProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const WORK_TYPES = ['Regular', 'After Hours', 'Travel', 'Remote', 'Holiday', 'Vacation'] as const

export function QuickClosePanel({ ticket, isOpen, onClose, onSuccess }: QuickClosePanelProps) {
  const [note, setNote] = useState('')
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(30)
  const [workType, setWorkType] = useState<string>('Regular')
  const [notifyClient, setNotifyClient] = useState(true)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [result, setResult] = useState<CloseTicketResult | null>(null)

  const { mutate, isPending, isSuccess, isError, error, reset } = useCloseTicket(ticket.id)

  // Pre-fill resolution note with ticket summary
  useEffect(() => {
    if (isOpen) {
      setNote(`Resolved - ${ticket.summary}`)
      setHours(0)
      setMinutes(30)
      setWorkType('Regular')
      setNotifyClient(true)
      setNotificationMessage('')
      setResult(null)
      reset()
    }
  }, [isOpen, ticket.summary, reset])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim() || isPending) return

    mutate(
      {
        resolutionNote: note,
        timeEntry: (hours > 0 || minutes > 0) ? {
          hours,
          minutes,
          workType,
          notes: note,
        } : undefined,
        notifyClient,
        notificationMessage: notifyClient && notificationMessage.trim() ? notificationMessage : undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data)
          if (data.success) {
            // Delay slightly for success animation
            setTimeout(() => {
              onSuccess?.()
              onClose()
            }, 1500)
          }
        },
      }
    )
  }, [note, hours, minutes, workType, notifyClient, notificationMessage, isPending, mutate, onSuccess, onClose])

  // Ctrl+Enter keyboard shortcut
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'Enter' && note.trim() && !isPending) {
        e.preventDefault()
        const form = document.getElementById('quick-close-form') as HTMLFormElement | null
        form?.requestSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, note, isPending])

  if (!isOpen) return null

  // Success state
  if (isSuccess && result?.success) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ticket Closed"
          className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700/50 shadow-2xl flex flex-col items-center justify-center animate-in slide-in-from-right duration-200"
        >
          <div className="text-center space-y-4 px-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ticket Closed</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              #{ticket.id} has been closed successfully.
            </p>
            <div className="space-y-1 text-xs text-gray-500">
              {result.actions.statusUpdated && <p>Status updated to Closed</p>}
              {result.actions.noteAdded && <p>Resolution note added</p>}
              {result.actions.timeEntryCreated && <p>Time entry logged</p>}
              {result.actions.clientNotified && <p>Client notified</p>}
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Partial warnings:</p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-yellow-600 dark:text-yellow-500">{err}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Close Ticket"
        className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700/50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Close Ticket</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ticket summary */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700/50">
          <p className="text-xs text-gray-500 font-mono">#{ticket.id}</p>
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mt-0.5">{ticket.summary}</p>
          <p className="text-xs text-gray-500 mt-1">{ticket.company}</p>
        </div>

        {/* Form */}
        <form id="quick-close-form" onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Error banner */}
            {isError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Failed to close ticket</p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                    {error instanceof Error ? error.message : 'An unexpected error occurred'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => reset()}
                  className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  aria-label="Dismiss error"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Resolution note */}
            <div>
              <label htmlFor="resolution-note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Resolution Note <span className="text-red-400">*</span>
              </label>
              <textarea
                id="resolution-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What was done to resolve this ticket..."
                rows={4}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Time entry section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  Time Spent
                </span>
              </label>

              {/* Hours + Minutes row */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="time-hours" className="sr-only">Hours</label>
                  <input
                    id="time-hours"
                    type="number"
                    step="1"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value, 10) || 0)}
                    className="w-16 px-2.5 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">hrs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <label htmlFor="time-minutes" className="sr-only">Minutes</label>
                  <input
                    id="time-minutes"
                    type="number"
                    step="15"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(parseInt(e.target.value, 10) || 0)}
                    className="w-16 px-2.5 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">min</span>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex gap-1 flex-wrap mb-3">
                {[
                  { label: '15m', h: 0, m: 15 },
                  { label: '30m', h: 0, m: 30 },
                  { label: '1h', h: 1, m: 0 },
                  { label: '1.5h', h: 1, m: 30 },
                  { label: '2h', h: 2, m: 0 },
                  { label: '4h', h: 4, m: 0 },
                ].map((preset) => {
                  const isActive = hours === preset.h && minutes === preset.m
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => { setHours(preset.h); setMinutes(preset.m) }}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>

              {/* Work type */}
              <div>
                <label htmlFor="work-type" className="block text-xs text-gray-500 mb-1">Work Type</label>
                <select
                  id="work-type"
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {WORK_TYPES.map((wt) => (
                    <option key={wt} value={wt}>{wt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700/50" />

            {/* Client notification toggle */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifyClient}
                  onClick={() => setNotifyClient(!notifyClient)}
                  className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 ${
                    notifyClient ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      notifyClient ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-2 flex-1">
                  {notifyClient ? (
                    <Bell size={14} className="text-blue-500" />
                  ) : (
                    <BellOff size={14} className="text-gray-400" />
                  )}
                  <div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {notifyClient ? 'Client will be notified' : 'No client notification'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {notifyClient
                        ? `Resolution email sent to ${ticket.contact ?? 'primary contact'}`
                        : 'Ticket closed silently (internal only)'}
                    </p>
                  </div>
                </div>
              </label>

              {/* Custom notification message */}
              {notifyClient && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label htmlFor="notification-message" className="block text-xs text-gray-500 mb-1">
                    Custom client message (optional)
                  </label>
                  <textarea
                    id="notification-message"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Leave blank to use the resolution note above..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/80 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
            >
              Cancel
            </button>
            {isError ? (
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none"
              >
                <RotateCcw size={14} />
                Retry
              </button>
            ) : (
              <button
                type="submit"
                disabled={!note.trim() || isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-green-500 focus:outline-none"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Closing...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Close Ticket
                  </>
                )}
              </button>
            )}
          </div>

          <div className="px-5 pb-3 text-center">
            <p className="text-[11px] text-gray-500">
              Ctrl+Enter to confirm
            </p>
          </div>
        </form>
      </div>
    </>
  )
}
