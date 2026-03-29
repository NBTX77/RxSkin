'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTimeTracker } from '@/contexts/TimeTrackerContext'
import {
  Play,
  Pause,
  Square,
  Clock,
  X,
  ChevronDown,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function secondsToHoursMinutes(totalSeconds: number): { hours: number; minutes: number } {
  const totalMinutes = Math.round(totalSeconds / 60)
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  }
}

// ── Work type options ────────────────────────────────────────

const WORK_TYPES = [
  { label: 'Regular', value: 'Regular' },
  { label: 'Remote Support', value: 'Remote Support' },
  { label: 'On-Site', value: 'On-Site' },
  { label: 'Travel', value: 'Travel' },
  { label: 'After Hours', value: 'After Hours' },
]

// ── Component ────────────────────────────────────────────────

export function TimerWidget() {
  const {
    activeTicketId,
    ticketSummary,
    elapsedSeconds,
    isRunning,
    isPaused,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  } = useTimeTracker()

  const queryClient = useQueryClient()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showStopForm, setShowStopForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Stop form state
  const { hours: defaultHours, minutes: defaultMinutes } = secondsToHoursMinutes(elapsedSeconds)
  const [formHours, setFormHours] = useState(defaultHours)
  const [formMinutes, setFormMinutes] = useState(defaultMinutes)
  const [workType, setWorkType] = useState('Regular')
  const [notes, setNotes] = useState('')

  // Don't render if no timer is active
  if (!activeTicketId || !isRunning) return null

  const handleStopClick = () => {
    pauseTimer()
    const { hours, minutes } = secondsToHoursMinutes(elapsedSeconds)
    setFormHours(hours)
    setFormMinutes(minutes)
    setNotes('')
    setWorkType('Regular')
    setShowStopForm(true)
  }

  const handleCancelStop = () => {
    setShowStopForm(false)
    resumeTimer()
  }

  const handleConfirmStop = async () => {
    if (!activeTicketId) return

    setSubmitting(true)
    const totalHours = formHours + formMinutes / 60

    try {
      const res = await fetch(`/api/tickets/${activeTicketId}/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualHours: Math.max(totalHours, 0.08), // minimum ~5 min
          notes: notes.trim() || undefined,
        }),
      })

      if (res.ok) {
        // Invalidate time entries cache for this ticket
        queryClient.invalidateQueries({ queryKey: ['ticket-time', activeTicketId] })
      }
    } catch {
      // silent fail -- user can manually add time
    }

    stopTimer()
    setShowStopForm(false)
    setSubmitting(false)
  }

  const handleDiscard = () => {
    resetTimer()
    setShowStopForm(false)
  }

  // ── Collapsed pill ──────────────────────────────────────────

  if (isCollapsed && !showStopForm) {
    return (
      <div className="fixed bottom-16 right-4 lg:bottom-6 lg:right-6 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Clock size={14} className="text-blue-500" />
          <span className={`text-sm font-mono font-semibold text-gray-900 dark:text-white ${!isPaused ? 'animate-pulse' : ''}`}>
            {formatTime(elapsedSeconds)}
          </span>
        </button>
      </div>
    )
  }

  // ── Stop confirmation form ──────────────────────────────────

  if (showStopForm) {
    return (
      <div className="fixed bottom-16 right-4 lg:bottom-6 lg:right-6 z-50 w-80">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Log Time Entry</span>
            </div>
            <button
              onClick={handleCancelStop}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Ticket info */}
            <div className="text-xs text-gray-500">
              <span className="font-mono">#{activeTicketId}</span>
              <span className="mx-1.5">-</span>
              <span className="text-gray-700 dark:text-gray-300">{ticketSummary.length > 40 ? ticketSummary.slice(0, 40) + '...' : ticketSummary}</span>
            </div>

            {/* Elapsed display */}
            <div className="text-center py-2">
              <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            {/* Hours + Minutes */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hours</label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  step={1}
                  value={formHours}
                  onChange={(e) => setFormHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Minutes</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={formMinutes}
                  onChange={(e) => setFormMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Work type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Work Type</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WORK_TYPES.map((wt) => (
                  <option key={wt.value} value={wt.value}>{wt.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you work on?"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleConfirmStop}
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving...' : 'Save Entry'}
              </button>
              <button
                onClick={handleDiscard}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 border border-gray-200 dark:border-gray-700/50 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Expanded widget ─────────────────────────────────────────

  return (
    <div className="fixed bottom-16 right-4 lg:bottom-6 lg:right-6 z-50 w-72">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 min-w-0">
            <Clock size={14} className="text-blue-500 flex-shrink-0" />
            <span className="text-xs font-mono text-gray-500 flex-shrink-0">#{activeTicketId}</span>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Minimize timer"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Ticket summary */}
        <div className="px-3 pt-2 pb-1">
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={ticketSummary}>
            {ticketSummary}
          </p>
        </div>

        {/* Timer display */}
        <div className="px-3 py-3 text-center">
          <span className={`text-3xl font-mono font-bold text-gray-900 dark:text-white ${!isPaused ? 'animate-pulse' : ''}`}>
            {formatTime(elapsedSeconds)}
          </span>
          {isPaused && (
            <p className="text-[10px] text-yellow-500 font-medium mt-1 uppercase tracking-wider">Paused</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 px-3 pb-3">
          {isPaused ? (
            <button
              onClick={resumeTimer}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-500 transition-colors"
              title="Resume"
            >
              <Play size={14} />
              Resume
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-600 text-white hover:bg-yellow-500 transition-colors"
              title="Pause"
            >
              <Pause size={14} />
              Pause
            </button>
          )}
          <button
            onClick={handleStopClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-colors"
            title="Stop and log time"
          >
            <Square size={14} />
            Stop
          </button>
        </div>
      </div>
    </div>
  )
}
