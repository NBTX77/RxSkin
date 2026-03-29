'use client'

// ============================================================
// M365CreateEvent — RX Skin
// Modal form for creating or editing M365 calendar events.
// Fields: subject, start/end, location, all-day, online meeting,
// attendees, and description.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Calendar, Loader2 } from 'lucide-react'

interface M365CreateEventProps {
  onClose: () => void
  defaultStart?: string
  defaultEnd?: string
  editEvent?: {
    id: string
    subject: string
    start: string
    end: string
    allDay: boolean
    location?: string
    isOnlineMeeting?: boolean
    attendees?: { name: string; address: string; response: string }[]
    bodyPreview?: string
  }
}

/** Convert ISO string to local datetime-local input value */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

/** Convert ISO string to local date input value */
function toDateInput(iso: string): string {
  const d = new Date(iso)
  return d.toISOString().split('T')[0]
}

function getTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function M365CreateEvent({ onClose, defaultStart, defaultEnd, editEvent }: M365CreateEventProps) {
  const queryClient = useQueryClient()
  const isEdit = !!editEvent

  // Form state
  const [subject, setSubject] = useState(editEvent?.subject || '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState(editEvent?.location || '')
  const [isAllDay, setIsAllDay] = useState(editEvent?.allDay || false)
  const [isOnlineMeeting, setIsOnlineMeeting] = useState(editEvent?.isOnlineMeeting || false)
  const [attendeesText, setAttendeesText] = useState(
    editEvent?.attendees?.map(a => a.address).join(', ') || ''
  )
  const [description, setDescription] = useState(editEvent?.bodyPreview || '')

  // Initialize date/time from props
  useEffect(() => {
    if (editEvent) {
      if (editEvent.allDay) {
        setStartDate(toDateInput(editEvent.start))
        setEndDate(toDateInput(editEvent.end))
      } else {
        const startLocal = toLocalInput(editEvent.start)
        const endLocal = toLocalInput(editEvent.end)
        setStartDate(startLocal.split('T')[0])
        setStartTime(startLocal.split('T')[1])
        setEndDate(endLocal.split('T')[0])
        setEndTime(endLocal.split('T')[1])
      }
    } else if (defaultStart) {
      const sLocal = toLocalInput(defaultStart)
      setStartDate(sLocal.split('T')[0])
      setStartTime(sLocal.split('T')[1] || '09:00')
      if (defaultEnd) {
        const eLocal = toLocalInput(defaultEnd)
        setEndDate(eLocal.split('T')[0])
        setEndTime(eLocal.split('T')[1] || '10:00')
      } else {
        setEndDate(sLocal.split('T')[0])
        setEndTime('10:00')
      }
    } else {
      const now = new Date()
      const nextHour = new Date(now)
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
      const afterHour = new Date(nextHour)
      afterHour.setHours(afterHour.getHours() + 1)
      setStartDate(toLocalInput(nextHour.toISOString()).split('T')[0])
      setStartTime(toLocalInput(nextHour.toISOString()).split('T')[1])
      setEndDate(toLocalInput(afterHour.toISOString()).split('T')[0])
      setEndTime(toLocalInput(afterHour.toISOString()).split('T')[1])
    }
  }, [defaultStart, defaultEnd, editEvent])

  // Build start/end ISO strings
  const buildDateTimes = useCallback(() => {
    const tz = getTimeZone()
    if (isAllDay) {
      return {
        start: { dateTime: `${startDate}T00:00:00`, timeZone: tz },
        end: { dateTime: `${endDate || startDate}T23:59:59`, timeZone: tz },
      }
    }
    return {
      start: { dateTime: `${startDate}T${startTime || '09:00'}:00`, timeZone: tz },
      end: { dateTime: `${endDate || startDate}T${endTime || '10:00'}:00`, timeZone: tz },
    }
  }, [startDate, startTime, endDate, endTime, isAllDay])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/m365/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to create event')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['m365', 'calendar'] })
      onClose()
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/m365/calendar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to update event')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['m365', 'calendar'] })
      onClose()
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error || updateMutation.error

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !startDate) return

    const { start, end } = buildDateTimes()

    const attendees = attendeesText
      .split(',')
      .map(email => email.trim())
      .filter(Boolean)

    const body: Record<string, unknown> = {
      subject: subject.trim(),
      start,
      end,
      location: location.trim() || undefined,
      attendees: attendees.length > 0 ? attendees : undefined,
      isOnlineMeeting,
      body: description.trim() || undefined,
    }

    if (isEdit && editEvent) {
      updateMutation.mutate({ id: editEvent.id, body })
    } else {
      createMutation.mutate(body)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit calendar event' : 'Create calendar event'}>
        <div className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {isEdit ? 'Edit Event' : 'New Event'}
              </h3>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Meeting title"
                required
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* All day toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">All day event</span>
            </label>

            {/* Date / Time inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {!isAllDay && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {!isAllDay && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Conference room, address, or link"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Online meeting toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOnlineMeeting}
                onChange={(e) => setIsOnlineMeeting(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Add online meeting (Teams)</span>
            </label>

            {/* Attendees */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Attendees</label>
              <input
                type="text"
                value={attendeesText}
                onChange={(e) => setAttendeesText(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-[10px] text-gray-500">Comma-separated email addresses</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event details..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                {error.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !subject.trim() || !startDate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
