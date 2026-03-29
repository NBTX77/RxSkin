'use client'

// ============================================================
// M365EventDetail — RX Skin
// Floating overlay card showing details of a selected M365
// calendar event. Attendees, location, online meeting link.
// ============================================================

import { X, MapPin, Users, Video, Trash2, Edit, Clock, User } from 'lucide-react'

interface M365CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  extendedProps: {
    location?: string
    organizer?: { name: string; address: string }
    attendees?: { name: string; address: string; response: string }[]
    onlineMeetingUrl?: string
    bodyPreview?: string
  }
}

interface M365EventDetailProps {
  event: M365CalendarEvent
  onClose: () => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function getDurationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const RESPONSE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  accepted: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', label: 'Accepted' },
  tentativelyAccepted: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', label: 'Tentative' },
  declined: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', label: 'Declined' },
  none: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', label: 'No response' },
  notResponded: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', label: 'No response' },
  organizer: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'Organizer' },
}

export function M365EventDetail({ event, onClose, onDelete, onEdit }: M365EventDetailProps) {
  const { location, organizer, attendees, onlineMeetingUrl, bodyPreview } = event.extendedProps
  const duration = getDurationMinutes(event.start, event.end)

  const handleDelete = () => {
    if (!confirm('Delete this calendar event?')) return
    onDelete(event.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32" role="dialog" aria-modal="true" aria-label="Calendar event details">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 sm:mx-0 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {event.title}
            </h3>
            {event.allDay && (
              <span className="mt-1 inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                All day
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-2 rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4 max-h-[60vh] overflow-y-auto">
          {/* Time */}
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-gray-500" />
            <div>
              {event.allDay ? (
                <div className="text-gray-900 dark:text-white">{formatDate(event.start)}</div>
              ) : (
                <>
                  <div className="text-gray-900 dark:text-white">
                    {formatDate(event.start)} &middot; {formatTime(event.start)} – {formatTime(event.end)}
                  </div>
                  <div className="text-xs text-gray-500">{formatDuration(duration)}</div>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">{location}</span>
            </div>
          )}

          {/* Organizer */}
          {organizer && (
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 shrink-0 text-gray-500" />
              <div>
                <span className="text-gray-700 dark:text-gray-300">{organizer.name}</span>
                <span className="ml-1 text-xs text-gray-500">({organizer.address})</span>
              </div>
            </div>
          )}

          {/* Online meeting */}
          {onlineMeetingUrl && (
            <a
              href={onlineMeetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
            >
              <Video className="h-4 w-4" />
              Join Meeting
            </a>
          )}

          {/* Attendees */}
          {attendees && attendees.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                <Users className="h-3.5 w-3.5" />
                Attendees ({attendees.length})
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {attendees.map((att, i) => {
                  const style = RESPONSE_STYLES[att.response] || RESPONSE_STYLES.none
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {att.name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{att.address}</div>
                      </div>
                      <span className={`shrink-0 ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Body preview */}
          {bodyPreview && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/80 p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-4">
                {bodyPreview}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <button
            onClick={() => onEdit(event.id)}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}
