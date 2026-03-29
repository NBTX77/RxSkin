'use client'

// ============================================================
// ScheduleEventDetail — RX Skin
// Floating overlay card showing details of a selected schedule entry.
// Uses the collapsible "bubble" card pattern (per project feedback).
// ============================================================

import { X, Clock, Building2, User, Ticket, ExternalLink, Trash2 } from 'lucide-react'
import type { ScheduleEntry } from '@/types'
import { useDeleteScheduleEntry } from '@/hooks/useScheduleEntries'
import Link from 'next/link'

interface ScheduleEventDetailProps {
  entry: ScheduleEntry
  onClose: () => void
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

export function ScheduleEventDetail({ entry, onClose }: ScheduleEventDetailProps) {
  const deleteEntry = useDeleteScheduleEntry()
  const duration = getDurationMinutes(entry.start, entry.end)

  const handleDelete = () => {
    if (!confirm('Delete this schedule entry?')) return
    deleteEntry.mutate(entry.id, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32" role="dialog" aria-modal="true" aria-label="Schedule entry details">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-gray-700 bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {entry.ticketSummary || `${entry.type} — ${entry.memberName}`}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  entry.status === 'Schedule Hold'
                    ? 'bg-amber-500/20 text-amber-400'
                    : entry.type === 'Recurring'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {entry.status}
              </span>
              <span className="text-gray-600">|</span>
              <span>{entry.type}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-2 rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          {/* Time */}
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-gray-500" />
            <div>
              <div className="text-gray-900 dark:text-white">
                {formatDate(entry.start)} &middot; {formatTime(entry.start)} – {formatTime(entry.end)}
              </div>
              <div className="text-xs text-gray-500">{formatDuration(duration)}</div>
            </div>
          </div>

          {/* Technician */}
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 shrink-0 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">{entry.memberName}</span>
          </div>

          {/* Company */}
          {entry.companyName && (
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 shrink-0 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">{entry.companyName}</span>
            </div>
          )}

          {/* Linked ticket */}
          {entry.ticketId && (
            <div className="flex items-center gap-3 text-sm">
              <Ticket className="h-4 w-4 shrink-0 text-gray-500" />
              <Link
                href={`/tickets/${entry.ticketId}`}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ticket #{entry.ticketId}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3">
          <button
            onClick={handleDelete}
            disabled={deleteEntry.isPending}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleteEntry.isPending ? 'Deleting...' : 'Delete'}
          </button>

          {entry.ticketId && (
            <Link
              href={`/tickets/${entry.ticketId}`}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
            >
              Open Ticket
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
